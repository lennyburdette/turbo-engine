use axum::{
    body::Body,
    extract::{ws::WebSocketUpgrade, Request, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use std::time::Duration;
use tokio_tungstenite::tungstenite::Message as TungsteniteMsg;
use tracing::{info_span, instrument, warn, Instrument};
use url::Url;

use crate::config::ConfigHandle;
use crate::error::GatewayError;

// ---------------------------------------------------------------------------
// Application state shared across handlers
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct AppState {
    pub config: ConfigHandle,
    pub http_client: reqwest::Client,
}

// ---------------------------------------------------------------------------
// Reverse proxy handler
// ---------------------------------------------------------------------------

/// The main proxy handler.  Every request that isn't a health check lands here.
///
/// 1. Look up the route in the routing table
/// 2. Build the upstream URL
/// 3. Forward the request (or upgrade to WebSocket)
/// 4. Stream the response back to the client
#[instrument(skip_all, fields(method = %req.method(), path = %req.uri().path()))]
pub async fn proxy_handler(
    State(state): State<AppState>,
    req: Request,
) -> Result<Response, GatewayError> {
    let path = req.uri().path().to_string();
    let query = req
        .uri()
        .query()
        .map(|q| format!("?{q}"))
        .unwrap_or_default();

    // --- Route matching ---
    let config = state.config.read().await;
    let (route, suffix) = config
        .routing
        .match_route(&path)
        .ok_or_else(|| GatewayError::RouteNotFound(path.clone()))?;

    let upstream_base = route.upstream_url.clone();
    let extra_headers = route.headers.clone();
    let timeout = Duration::from_millis(route.timeout_ms);
    let is_websocket = route.websocket;

    // Build upstream URL.
    let upstream_url = build_upstream_url(&upstream_base, &suffix, &query)?;

    // Drop the config read lock before doing I/O.
    drop(config);

    // --- WebSocket upgrade ---
    if is_websocket && req.headers().get(header::UPGRADE).is_some() {
        return handle_websocket_upgrade(req, upstream_url).await;
    }

    // --- Normal HTTP proxy ---
    forward_http(state.http_client, req, upstream_url, extra_headers, timeout).await
}

// ---------------------------------------------------------------------------
// HTTP forwarding
// ---------------------------------------------------------------------------

async fn forward_http(
    client: reqwest::Client,
    req: Request,
    upstream_url: Url,
    extra_headers: std::collections::HashMap<String, String>,
    timeout: Duration,
) -> Result<Response, GatewayError> {
    let method = req.method().clone();
    let span = info_span!("proxy_upstream", upstream = %upstream_url);

    // Copy headers, filtering out hop-by-hop headers.
    let mut headers = filter_hop_headers(req.headers());

    // Inject extra headers configured on the route.
    for (k, v) in &extra_headers {
        if let (Ok(name), Ok(val)) = (k.parse::<header::HeaderName>(), HeaderValue::from_str(v)) {
            headers.insert(name, val);
        }
    }

    // Set X-Forwarded-* headers.
    if let Some(host) = req.headers().get(header::HOST) {
        headers.insert("x-forwarded-host", host.clone());
    }
    headers.insert("x-forwarded-proto", HeaderValue::from_static("https"));

    // Read body.
    let body_bytes = axum::body::to_bytes(req.into_body(), 10 * 1024 * 1024)
        .await
        .map_err(|e| {
            GatewayError::UpstreamUnavailable(format!("failed to read request body: {e}"))
        })?;

    // Forward the request.
    let upstream_resp = client
        .request(method, upstream_url.as_str())
        .headers(reqwest_headers(&headers))
        .timeout(timeout)
        .body(body_bytes)
        .send()
        .instrument(span)
        .await?;

    // Convert upstream response back to axum response.
    let status =
        StatusCode::from_u16(upstream_resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let resp_headers = axum_headers(upstream_resp.headers());
    let body = upstream_resp.bytes().await?;

    let mut response = Response::builder()
        .status(status)
        .body(Body::from(body))
        .unwrap();

    *response.headers_mut() = resp_headers;

    Ok(response)
}

// ---------------------------------------------------------------------------
// WebSocket proxy
// ---------------------------------------------------------------------------

async fn handle_websocket_upgrade(
    mut req: Request,
    upstream_url: Url,
) -> Result<Response, GatewayError> {
    // Convert http(s) to ws(s) scheme.
    let ws_url = match upstream_url.scheme() {
        "http" => upstream_url.as_str().replacen("http://", "ws://", 1),
        "https" => upstream_url.as_str().replacen("https://", "wss://", 1),
        _ => upstream_url.to_string(),
    };

    // WebSocketUpgrade does not implement Clone, so we remove it from the
    // request extensions (taking ownership) instead of cloning.
    let ws_upgrade: Option<WebSocketUpgrade> = req.extensions_mut().remove::<WebSocketUpgrade>();

    let upgrade = match ws_upgrade {
        Some(u) => u,
        None => {
            return Err(GatewayError::WebSocket(
                "WebSocket upgrade header present but extraction failed".to_string(),
            ));
        }
    };

    Ok(upgrade.on_upgrade(move |client_ws| async move {
        let span = info_span!("ws_proxy", upstream = %ws_url);
        async {
            match tokio_tungstenite::connect_async(&ws_url).await {
                Ok((upstream_ws, _)) => {
                    bridge_websockets(client_ws, upstream_ws).await;
                }
                Err(err) => {
                    warn!(%err, "failed to connect to upstream WebSocket");
                }
            }
        }
        .instrument(span)
        .await
    }))
}

/// Bidirectional bridge between the client WebSocket (axum) and the upstream
/// WebSocket (tungstenite).
async fn bridge_websockets(
    client_ws: axum::extract::ws::WebSocket,
    upstream_ws: tokio_tungstenite::WebSocketStream<
        tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
    >,
) {
    let (mut client_tx, mut client_rx) = client_ws.split();
    let (mut upstream_tx, mut upstream_rx) = upstream_ws.split();

    // Client -> Upstream
    let c2u = tokio::spawn(async move {
        while let Some(Ok(msg)) = client_rx.next().await {
            let tung_msg = axum_msg_to_tungstenite(msg);
            if upstream_tx.send(tung_msg).await.is_err() {
                break;
            }
        }
    });

    // Upstream -> Client
    let u2c = tokio::spawn(async move {
        while let Some(Ok(msg)) = upstream_rx.next().await {
            let axum_msg = tungstenite_msg_to_axum(msg);
            if client_tx.send(axum_msg).await.is_err() {
                break;
            }
        }
    });

    // Wait for either direction to close.
    tokio::select! {
        _ = c2u => {},
        _ = u2c => {},
    }
}

// ---------------------------------------------------------------------------
// Message conversion helpers
// ---------------------------------------------------------------------------

fn axum_msg_to_tungstenite(msg: axum::extract::ws::Message) -> TungsteniteMsg {
    match msg {
        axum::extract::ws::Message::Text(t) => TungsteniteMsg::Text(t.to_string()),
        axum::extract::ws::Message::Binary(b) => TungsteniteMsg::Binary(b.to_vec()),
        axum::extract::ws::Message::Ping(p) => TungsteniteMsg::Ping(p.to_vec()),
        axum::extract::ws::Message::Pong(p) => TungsteniteMsg::Pong(p.to_vec()),
        axum::extract::ws::Message::Close(_) => TungsteniteMsg::Close(None),
    }
}

fn tungstenite_msg_to_axum(msg: TungsteniteMsg) -> axum::extract::ws::Message {
    match msg {
        TungsteniteMsg::Text(t) => axum::extract::ws::Message::Text(t),
        TungsteniteMsg::Binary(b) => axum::extract::ws::Message::Binary(b),
        TungsteniteMsg::Ping(p) => axum::extract::ws::Message::Ping(p),
        TungsteniteMsg::Pong(p) => axum::extract::ws::Message::Pong(p),
        TungsteniteMsg::Close(_) => axum::extract::ws::Message::Close(None),
        TungsteniteMsg::Frame(_) => axum::extract::ws::Message::Close(None),
    }
}

// ---------------------------------------------------------------------------
// Header utilities
// ---------------------------------------------------------------------------

/// Headers that MUST NOT be forwarded between hops.
const HOP_HEADERS: &[&str] = &[
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
];

/// Filter out hop-by-hop headers from a header map.
fn filter_hop_headers(headers: &HeaderMap) -> HeaderMap {
    let mut filtered = HeaderMap::new();
    for (name, value) in headers {
        if !HOP_HEADERS.contains(&name.as_str()) {
            filtered.insert(name.clone(), value.clone());
        }
    }
    filtered
}

/// Convert axum `HeaderMap` to `reqwest::header::HeaderMap`.
fn reqwest_headers(headers: &HeaderMap) -> reqwest::header::HeaderMap {
    let mut out = reqwest::header::HeaderMap::new();
    for (name, value) in headers {
        if let (Ok(n), Ok(v)) = (
            reqwest::header::HeaderName::from_bytes(name.as_ref()),
            reqwest::header::HeaderValue::from_bytes(value.as_bytes()),
        ) {
            out.insert(n, v);
        }
    }
    out
}

/// Convert reqwest `HeaderMap` to axum `HeaderMap`.
fn axum_headers(headers: &reqwest::header::HeaderMap) -> HeaderMap {
    let mut out = HeaderMap::new();
    for (name, value) in headers {
        if let (Ok(n), Ok(v)) = (
            header::HeaderName::from_bytes(name.as_ref()),
            HeaderValue::from_bytes(value.as_bytes()),
        ) {
            // Filter out hop-by-hop from the response too.
            if !HOP_HEADERS.contains(&n.as_str()) {
                out.insert(n, v);
            }
        }
    }
    out
}

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

fn build_upstream_url(base: &str, suffix: &str, query: &str) -> Result<Url, GatewayError> {
    let base = base.trim_end_matches('/');
    let suffix = if suffix.starts_with('/') {
        suffix.to_string()
    } else {
        format!("/{suffix}")
    };
    let raw = format!("{base}{suffix}{query}");
    Url::parse(&raw).map_err(|e| GatewayError::Config(format!("bad upstream URL '{raw}': {e}")))
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_upstream_url_basic() {
        let url = build_upstream_url("http://svc:8080", "/foo/bar", "").unwrap();
        assert_eq!(url.as_str(), "http://svc:8080/foo/bar");
    }

    #[test]
    fn test_build_upstream_url_with_query() {
        let url = build_upstream_url("http://svc:8080", "/foo", "?x=1").unwrap();
        assert_eq!(url.as_str(), "http://svc:8080/foo?x=1");
    }

    #[test]
    fn test_build_upstream_url_trailing_slash() {
        let url = build_upstream_url("http://svc:8080/", "/bar", "").unwrap();
        assert_eq!(url.as_str(), "http://svc:8080/bar");
    }

    #[test]
    fn test_filter_hop_headers() {
        let mut headers = HeaderMap::new();
        headers.insert("content-type", HeaderValue::from_static("application/json"));
        headers.insert("connection", HeaderValue::from_static("keep-alive"));
        headers.insert("x-custom", HeaderValue::from_static("value"));

        let filtered = filter_hop_headers(&headers);
        assert!(filtered.contains_key("content-type"));
        assert!(filtered.contains_key("x-custom"));
        assert!(!filtered.contains_key("connection"));
    }
}
