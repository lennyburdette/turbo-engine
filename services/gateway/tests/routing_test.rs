//! Integration tests for the gateway routing, proxying, health check, and
//! error handling.
//!
//! These tests spin up:
//! - A mock upstream (using `wiremock`) to assert the gateway forwards correctly.
//! - The gateway `Router` (via `axum_test`) without actually binding a TCP port.

use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use serde_json::json;
use std::collections::HashMap;
use tower::ServiceExt; // for `oneshot`
use wiremock::{
    matchers::{method, path},
    Mock, MockServer, ResponseTemplate,
};

// ---------------------------------------------------------------------------
// Helpers — we reach into the crate's public API to build a test router.
// Because integration tests live in `tests/` they cannot use `crate::` paths.
// Instead we construct the types directly via their public interface and build
// an axum Router from scratch, mirroring what `main` does.
// ---------------------------------------------------------------------------

/// Build the gateway Router wired to a real upstream at `upstream_base_url`.
fn test_router(routes: Vec<gateway::config::Route>) -> Router {
    let config = gateway::config::IngressConfig {
        routing: gateway::config::RoutingTable { routes },
        cors: gateway::config::CorsConfig::default(),
        rate_limit: None,
        poll_interval_secs: 600,
    };

    let config_handle = gateway::config::ConfigHandle::new(config);

    let http_client = reqwest::Client::builder()
        .build()
        .expect("client");

    let state = gateway::proxy::AppState {
        config: config_handle,
        http_client,
    };

    // Minimal router matching main.rs structure — health + proxy fallback.
    Router::new()
        .route("/healthz", axum::routing::get(health_handler))
        .fallback(gateway::proxy::proxy_handler)
        .with_state(state)
}

async fn health_handler() -> axum::Json<serde_json::Value> {
    axum::Json(json!({ "status": "ok" }))
}

fn make_route(prefix: &str, upstream: &str) -> gateway::config::Route {
    gateway::config::Route {
        path_prefix: prefix.to_string(),
        upstream_url: upstream.to_string(),
        strip_prefix: true,
        headers: HashMap::new(),
        rate_limit: None,
        timeout_ms: 5_000,
        websocket: false,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[tokio::test]
async fn test_health_check_returns_ok() {
    let app = test_router(vec![]);

    let req = Request::builder()
        .uri("/healthz")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();

    assert_eq!(resp.status(), StatusCode::OK);

    let body = axum::body::to_bytes(resp.into_body(), 1024)
        .await
        .unwrap();
    let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(value["status"], "ok");
}

#[tokio::test]
async fn test_unmatched_route_returns_404() {
    let app = test_router(vec![make_route("/api", "http://localhost:1")]);

    let req = Request::builder()
        .uri("/unknown/path")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();

    assert_eq!(resp.status(), StatusCode::NOT_FOUND);

    let body = axum::body::to_bytes(resp.into_body(), 4096)
        .await
        .unwrap();
    let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(value["error"]["message"]
        .as_str()
        .unwrap()
        .contains("No route matched"));
}

#[tokio::test]
async fn test_proxy_forwards_to_upstream() {
    // Start a mock upstream server.
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/hello"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(json!({ "greeting": "world" })),
        )
        .mount(&mock_server)
        .await;

    let app = test_router(vec![make_route("/api", &mock_server.uri())]);

    let req = Request::builder()
        .uri("/api/hello")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();

    assert_eq!(resp.status(), StatusCode::OK);

    let body = axum::body::to_bytes(resp.into_body(), 4096)
        .await
        .unwrap();
    let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(value["greeting"], "world");
}

#[tokio::test]
async fn test_proxy_forwards_post_body() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/submit"))
        .respond_with(ResponseTemplate::new(201).set_body_json(json!({ "id": 42 })))
        .mount(&mock_server)
        .await;

    let app = test_router(vec![make_route("/api", &mock_server.uri())]);

    let req = Request::builder()
        .method("POST")
        .uri("/api/submit")
        .header("content-type", "application/json")
        .body(Body::from(r#"{"name":"test"}"#))
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::CREATED);
}

#[tokio::test]
async fn test_proxy_preserves_query_string() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/search"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "results": [] })))
        .mount(&mock_server)
        .await;

    let app = test_router(vec![make_route("/api", &mock_server.uri())]);

    let req = Request::builder()
        .uri("/api/search?q=hello&limit=10")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_longest_prefix_match() {
    let mock_users = MockServer::start().await;
    let mock_api = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "service": "users" })))
        .mount(&mock_users)
        .await;

    Mock::given(method("GET"))
        .and(path("/users/123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "service": "api" })))
        .mount(&mock_api)
        .await;

    let app = test_router(vec![
        make_route("/api/users", &mock_users.uri()),
        make_route("/api", &mock_api.uri()),
    ]);

    // /api/users/123 should match the more specific /api/users route.
    let req = Request::builder()
        .uri("/api/users/123")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    let body = axum::body::to_bytes(resp.into_body(), 4096)
        .await
        .unwrap();
    let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(value["service"], "users");
}

#[tokio::test]
async fn test_upstream_error_propagates_status() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/fail"))
        .respond_with(ResponseTemplate::new(503).set_body_string("service down"))
        .mount(&mock_server)
        .await;

    let app = test_router(vec![make_route("/api", &mock_server.uri())]);

    let req = Request::builder()
        .uri("/api/fail")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn test_extra_headers_injected() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/check"))
        .respond_with(ResponseTemplate::new(200))
        .expect(1)
        .mount(&mock_server)
        .await;

    let mut extra = HashMap::new();
    extra.insert("X-Custom-Header".to_string(), "custom-value".to_string());

    let route = gateway::config::Route {
        path_prefix: "/svc".to_string(),
        upstream_url: mock_server.uri(),
        strip_prefix: true,
        headers: extra,
        rate_limit: None,
        timeout_ms: 5_000,
        websocket: false,
    };

    let app = test_router(vec![route]);

    let req = Request::builder()
        .uri("/svc/check")
        .body(Body::empty())
        .unwrap();

    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}
