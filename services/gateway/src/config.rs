use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tracing::{info, warn};
use url::Url;

use crate::error::GatewayError;

// ---------------------------------------------------------------------------
// Configuration types
// ---------------------------------------------------------------------------

/// Top-level ingress configuration — everything the gateway needs to know.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngressConfig {
    /// The routing table that maps path prefixes to upstream services.
    pub routing: RoutingTable,

    /// CORS configuration applied globally (can be overridden per-route).
    #[serde(default)]
    pub cors: CorsConfig,

    /// Default rate-limit applied to all routes unless overridden.
    #[serde(default)]
    pub rate_limit: Option<RateLimitConfig>,

    /// How often (in seconds) to poll the config source for changes.
    #[serde(default = "default_poll_interval_secs")]
    pub poll_interval_secs: u64,
}

/// The routing table: an ordered list of routes evaluated top-to-bottom.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingTable {
    pub routes: Vec<Route>,
}

/// A single routing rule.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    /// Path prefix to match (e.g. "/api/v1/users").  The longest-prefix wins
    /// if multiple routes overlap, but evaluation is top-to-bottom for equal
    /// length.
    pub path_prefix: String,

    /// The upstream URL to proxy to.  The matched prefix is stripped and the
    /// remainder is appended to this URL.
    pub upstream_url: String,

    /// Whether to strip the matched prefix before forwarding.
    #[serde(default = "default_true")]
    pub strip_prefix: bool,

    /// Extra headers to inject into the upstream request.
    #[serde(default)]
    pub headers: HashMap<String, String>,

    /// Per-route rate limit (overrides global).
    #[serde(default)]
    pub rate_limit: Option<RateLimitConfig>,

    /// Per-route timeout in milliseconds.
    #[serde(default = "default_timeout_ms")]
    pub timeout_ms: u64,

    /// Whether WebSocket upgrade is allowed on this route.
    #[serde(default)]
    pub websocket: bool,
}

/// CORS configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorsConfig {
    #[serde(default = "default_cors_origins")]
    pub allowed_origins: Vec<String>,
    #[serde(default = "default_cors_methods")]
    pub allowed_methods: Vec<String>,
    #[serde(default = "default_cors_headers")]
    pub allowed_headers: Vec<String>,
    #[serde(default)]
    pub allow_credentials: bool,
    #[serde(default = "default_cors_max_age")]
    pub max_age_secs: u64,
}

/// Token-bucket rate limit configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    /// Maximum number of requests in the window.
    pub requests_per_second: u32,
    /// Burst size (bucket capacity).
    pub burst: u32,
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

fn default_true() -> bool {
    true
}
fn default_timeout_ms() -> u64 {
    30_000
}
fn default_poll_interval_secs() -> u64 {
    15
}
fn default_cors_origins() -> Vec<String> {
    vec!["*".to_string()]
}
fn default_cors_methods() -> Vec<String> {
    vec![
        "GET".into(),
        "POST".into(),
        "PUT".into(),
        "DELETE".into(),
        "OPTIONS".into(),
        "PATCH".into(),
    ]
}
fn default_cors_headers() -> Vec<String> {
    vec![
        "Content-Type".into(),
        "Authorization".into(),
        "X-Request-ID".into(),
    ]
}
fn default_cors_max_age() -> u64 {
    86400
}

impl Default for CorsConfig {
    fn default() -> Self {
        Self {
            allowed_origins: default_cors_origins(),
            allowed_methods: default_cors_methods(),
            allowed_headers: default_cors_headers(),
            allow_credentials: false,
            max_age_secs: default_cors_max_age(),
        }
    }
}

impl Default for IngressConfig {
    fn default() -> Self {
        Self {
            routing: RoutingTable { routes: Vec::new() },
            cors: CorsConfig::default(),
            rate_limit: None,
            poll_interval_secs: default_poll_interval_secs(),
        }
    }
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

impl RoutingTable {
    /// Find the best matching route for a given path.
    /// Returns the matched route and the remaining path suffix.
    pub fn match_route<'a>(&'a self, path: &str) -> Option<(&'a Route, String)> {
        let mut best: Option<(&Route, String)> = None;
        let mut best_len = 0;

        for route in &self.routes {
            let prefix = route.path_prefix.trim_end_matches('/');
            let normalized_path = if path == prefix || path.starts_with(&format!("{prefix}/")) {
                Some(path)
            } else if prefix.is_empty() {
                // An empty prefix matches everything.
                Some(path)
            } else {
                None
            };

            if let Some(matched_path) = normalized_path {
                if prefix.len() >= best_len {
                    let suffix = if route.strip_prefix {
                        let stripped = &matched_path[prefix.len()..];
                        if stripped.is_empty() {
                            "/".to_string()
                        } else {
                            stripped.to_string()
                        }
                    } else {
                        matched_path.to_string()
                    };

                    best_len = prefix.len();
                    best = Some((route, suffix));
                }
            }
        }

        best
    }
}

// ---------------------------------------------------------------------------
// Configuration source
// ---------------------------------------------------------------------------

/// Where to load the IngressConfig from.
#[derive(Debug, Clone)]
pub enum ConfigSource {
    /// A local JSON file path.
    File(String),
    /// A remote URL (typically the operator service).
    Url(String),
}

impl ConfigSource {
    pub fn from_str_auto(s: &str) -> Self {
        if s.starts_with("http://") || s.starts_with("https://") {
            ConfigSource::Url(s.to_string())
        } else {
            ConfigSource::File(s.to_string())
        }
    }
}

/// Load the ingress config from the given source once.
pub async fn load_config(source: &ConfigSource) -> Result<IngressConfig, GatewayError> {
    match source {
        ConfigSource::File(path) => load_from_file(path).await,
        ConfigSource::Url(url) => load_from_url(url).await,
    }
}

async fn load_from_file(path: &str) -> Result<IngressConfig, GatewayError> {
    let data = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| GatewayError::Config(format!("failed to read config file {path}: {e}")))?;

    // Support both JSON and YAML-like JSON.
    let config: IngressConfig = if Path::new(path)
        .extension()
        .is_some_and(|ext| ext == "yaml" || ext == "yml")
    {
        // For simplicity we only support JSON; YAML can be added with the
        // serde_yaml crate later.  For now, treat .yaml as JSON.
        serde_json::from_str(&data)
            .map_err(|e| GatewayError::Config(format!("failed to parse config: {e}")))?
    } else {
        serde_json::from_str(&data)
            .map_err(|e| GatewayError::Config(format!("failed to parse config: {e}")))?
    };

    Ok(config)
}

async fn load_from_url(url: &str) -> Result<IngressConfig, GatewayError> {
    let _parsed = Url::parse(url)?;
    let resp = reqwest::get(url).await?;

    if !resp.status().is_success() {
        return Err(GatewayError::Config(format!(
            "config endpoint returned HTTP {}",
            resp.status()
        )));
    }

    let config: IngressConfig = resp
        .json()
        .await
        .map_err(|e| GatewayError::Config(format!("failed to decode config response: {e}")))?;

    Ok(config)
}

// ---------------------------------------------------------------------------
// Shared, reloadable config handle
// ---------------------------------------------------------------------------

/// Thread-safe handle to the current routing configuration.
/// Readers acquire a read lock; the background poller acquires a write lock.
#[derive(Clone)]
pub struct ConfigHandle {
    inner: Arc<RwLock<IngressConfig>>,
}

impl ConfigHandle {
    pub fn new(config: IngressConfig) -> Self {
        Self {
            inner: Arc::new(RwLock::new(config)),
        }
    }

    /// Get a read snapshot of the current config.
    pub async fn read(&self) -> tokio::sync::RwLockReadGuard<'_, IngressConfig> {
        self.inner.read().await
    }

    /// Replace the config with a new version.
    pub async fn update(&self, config: IngressConfig) {
        let mut w = self.inner.write().await;
        *w = config;
    }
}

/// Spawn a background task that periodically reloads the configuration.
pub fn spawn_config_watcher(
    handle: ConfigHandle,
    source: ConfigSource,
    poll_interval: Duration,
) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(poll_interval);
        // The first tick completes immediately; skip it since we already loaded.
        interval.tick().await;

        loop {
            interval.tick().await;

            match load_config(&source).await {
                Ok(new_config) => {
                    info!(routes = new_config.routing.routes.len(), "config reloaded");
                    handle.update(new_config).await;
                }
                Err(err) => {
                    warn!(%err, "failed to reload config — keeping previous version");
                }
            }
        }
    })
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_routes() -> RoutingTable {
        RoutingTable {
            routes: vec![
                Route {
                    path_prefix: "/api/v1/users".to_string(),
                    upstream_url: "http://users-svc:8080".to_string(),
                    strip_prefix: true,
                    headers: HashMap::new(),
                    rate_limit: None,
                    timeout_ms: 30_000,
                    websocket: false,
                },
                Route {
                    path_prefix: "/api/v1".to_string(),
                    upstream_url: "http://api-svc:8080".to_string(),
                    strip_prefix: true,
                    headers: HashMap::new(),
                    rate_limit: None,
                    timeout_ms: 30_000,
                    websocket: false,
                },
                Route {
                    path_prefix: "/ws".to_string(),
                    upstream_url: "http://ws-svc:8080".to_string(),
                    strip_prefix: true,
                    headers: HashMap::new(),
                    rate_limit: None,
                    timeout_ms: 60_000,
                    websocket: true,
                },
            ],
        }
    }

    #[test]
    fn test_longest_prefix_wins() {
        let table = sample_routes();
        let (route, suffix) = table.match_route("/api/v1/users/123").unwrap();
        assert_eq!(route.upstream_url, "http://users-svc:8080");
        assert_eq!(suffix, "/123");
    }

    #[test]
    fn test_shorter_prefix_match() {
        let table = sample_routes();
        let (route, suffix) = table.match_route("/api/v1/orders/42").unwrap();
        assert_eq!(route.upstream_url, "http://api-svc:8080");
        assert_eq!(suffix, "/orders/42");
    }

    #[test]
    fn test_exact_prefix_match() {
        let table = sample_routes();
        let (route, suffix) = table.match_route("/api/v1/users").unwrap();
        assert_eq!(route.upstream_url, "http://users-svc:8080");
        assert_eq!(suffix, "/");
    }

    #[test]
    fn test_websocket_route() {
        let table = sample_routes();
        let (route, _suffix) = table.match_route("/ws/graphql").unwrap();
        assert!(route.websocket);
    }

    #[test]
    fn test_no_match() {
        let table = sample_routes();
        assert!(table.match_route("/unknown/path").is_none());
    }

    #[test]
    fn test_deserialize_config() {
        let json = r#"{
            "routing": {
                "routes": [
                    {
                        "path_prefix": "/api",
                        "upstream_url": "http://localhost:3000",
                        "headers": { "X-Forwarded-For": "gateway" }
                    }
                ]
            }
        }"#;

        let config: IngressConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.routing.routes.len(), 1);
        assert_eq!(config.routing.routes[0].timeout_ms, 30_000);
        assert!(config.routing.routes[0].strip_prefix);
    }
}
