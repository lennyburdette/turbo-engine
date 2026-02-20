mod config;
mod error;
mod middleware;
mod proxy;

use axum::{middleware as axum_mw, response::Json, routing::get, Router};
use clap::Parser;
use opentelemetry::trace::TracerProvider as _;
use opentelemetry_sdk::trace::TracerProvider;
use serde_json::json;
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::signal;
use tower_http::trace::TraceLayer;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::config::{
    spawn_config_watcher, ConfigHandle, ConfigSource, IngressConfig, RoutingTable,
};
use crate::middleware::{build_cors_layer, RateLimiter};
use crate::proxy::AppState;

// ---------------------------------------------------------------------------
// CLI arguments
// ---------------------------------------------------------------------------

#[derive(Parser, Debug)]
#[command(
    name = "gateway",
    about = "turbo-engine API gateway / ingress controller"
)]
struct Args {
    /// Port to listen on.
    #[arg(long, default_value = "8080", env = "PORT")]
    port: u16,

    /// Path or URL to the routing configuration.
    ///
    /// If the value starts with `http://` or `https://` it is fetched over
    /// HTTP (typically from the operator service).  Otherwise it is treated
    /// as a local file path.  When omitted the gateway starts with an empty
    /// routing table (useful for health-check-only boot).
    #[arg(long, env = "CONFIG_URL")]
    config_url: Option<String>,

    /// OTLP exporter endpoint (gRPC).
    #[arg(
        long,
        default_value = "http://localhost:4317",
        env = "OTEL_EXPORTER_OTLP_ENDPOINT"
    )]
    otlp_endpoint: String,
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

#[tokio::main]
async fn main() {
    let args = Args::parse();

    // --- Observability -------------------------------------------------------
    init_tracing(&args.otlp_endpoint);

    info!(port = args.port, config_url = ?args.config_url, "starting gateway");

    // --- Configuration -------------------------------------------------------
    let (config, config_source) = load_initial_config(&args).await;
    let config_handle = ConfigHandle::new(config.clone());

    // Start background config watcher if we have a source.
    let _watcher = config_source.map(|source| {
        let poll = Duration::from_secs(config.poll_interval_secs);
        spawn_config_watcher(config_handle.clone(), source, poll)
    });

    // --- Rate limiter --------------------------------------------------------
    let rate_limiter = config
        .rate_limit
        .as_ref()
        .map(|rl| RateLimiter::new(rl.requests_per_second, rl.burst));

    // --- HTTP client for proxying --------------------------------------------
    let http_client = reqwest::Client::builder()
        .pool_max_idle_per_host(32)
        .timeout(Duration::from_secs(60))
        .build()
        .expect("failed to build HTTP client");

    let app_state = AppState {
        config: config_handle.clone(),
        http_client,
    };

    // --- Router --------------------------------------------------------------
    let app = build_router(app_state, rate_limiter, &config);

    // --- Server --------------------------------------------------------------
    let addr = SocketAddr::from(([0, 0, 0, 0], args.port));
    let listener = TcpListener::bind(addr)
        .await
        .expect("failed to bind listener");

    info!(%addr, "gateway listening");

    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");

    info!("gateway shut down gracefully");
}

// ---------------------------------------------------------------------------
// Router construction
// ---------------------------------------------------------------------------

fn build_router(
    app_state: AppState,
    rate_limiter: Option<RateLimiter>,
    config: &IngressConfig,
) -> Router {
    let cors_layer = build_cors_layer(&config.cors);

    // The fallback handler proxies everything that isn't a well-known route.
    let proxy_router = Router::new()
        .fallback(proxy::proxy_handler)
        .with_state(app_state);

    Router::new()
        // Well-known endpoints.
        .route("/healthz", get(health_check))
        .route("/readyz", get(readiness_check))
        // Merge the proxy router so it handles everything else.
        .merge(proxy_router)
        // Middleware stack (outermost first).
        .layer(cors_layer)
        .layer(TraceLayer::new_for_http())
        .layer(axum_mw::from_fn(middleware::request_id))
        .layer(axum_mw::from_fn(middleware::auth_passthrough))
        .layer(axum_mw::from_fn_with_state(
            rate_limiter,
            middleware::rate_limit,
        ))
}

// ---------------------------------------------------------------------------
// Health & readiness
// ---------------------------------------------------------------------------

async fn health_check() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

async fn readiness_check() -> Json<serde_json::Value> {
    // In a production deployment this would verify the config is loaded and
    // at least one upstream is reachable.  For now, always ready.
    Json(json!({ "status": "ready" }))
}

// ---------------------------------------------------------------------------
// Configuration loading
// ---------------------------------------------------------------------------

async fn load_initial_config(args: &Args) -> (IngressConfig, Option<ConfigSource>) {
    match &args.config_url {
        Some(url) => {
            let source = ConfigSource::from_str_auto(url);
            match config::load_config(&source).await {
                Ok(cfg) => {
                    info!(routes = cfg.routing.routes.len(), "loaded initial config");
                    (cfg, Some(source))
                }
                Err(err) => {
                    warn!(%err, "failed to load config — starting with empty routing table");
                    (IngressConfig::default(), Some(source))
                }
            }
        }
        None => {
            info!("no config-url provided — starting with empty routing table");
            (
                IngressConfig {
                    routing: RoutingTable { routes: Vec::new() },
                    ..Default::default()
                },
                None,
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => info!("received Ctrl+C, shutting down"),
        _ = terminate => info!("received SIGTERM, shutting down"),
    }
}

// ---------------------------------------------------------------------------
// OpenTelemetry / tracing initialisation
// ---------------------------------------------------------------------------

fn init_tracing(otlp_endpoint: &str) {
    use tracing_subscriber::Layer;

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("gateway=info,tower_http=info"));

    let fmt_layer = tracing_subscriber::fmt::layer()
        .with_target(true)
        .with_thread_ids(false)
        .compact();

    // Try to set up the OTLP exporter.  If it fails (e.g. collector not
    // reachable) we fall back to stdout-only tracing.
    let otel_layer = match try_init_otel(otlp_endpoint) {
        Ok(layer) => {
            let boxed: Box<dyn Layer<tracing_subscriber::Registry> + Send + Sync> = Box::new(layer);
            Some(boxed)
        }
        Err(err) => {
            eprintln!("WARN: failed to initialise OTLP tracing ({err}), falling back to stdout");
            None
        }
    };

    // Build the subscriber.  The OTEL layer goes directly on the Registry
    // (before fmt and filter) so that its generic parameter matches.
    tracing_subscriber::registry()
        .with(otel_layer)
        .with(env_filter)
        .with(fmt_layer)
        .init();
}

fn try_init_otel(
    otlp_endpoint: &str,
) -> Result<
    tracing_opentelemetry::OpenTelemetryLayer<
        tracing_subscriber::Registry,
        opentelemetry_sdk::trace::Tracer,
    >,
    Box<dyn std::error::Error>,
> {
    use opentelemetry_otlp::WithExportConfig;

    let exporter = opentelemetry_otlp::new_exporter()
        .tonic()
        .with_endpoint(otlp_endpoint);

    let provider = TracerProvider::builder()
        .with_batch_exporter(
            exporter.build_span_exporter()?,
            opentelemetry_sdk::runtime::Tokio,
        )
        .build();

    let tracer = provider.tracer("gateway");

    // Register the global provider so other crates can use it.
    opentelemetry::global::set_tracer_provider(provider);

    Ok(tracing_opentelemetry::layer().with_tracer(tracer))
}
