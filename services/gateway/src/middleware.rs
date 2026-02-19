use axum::{
    extract::Request,
    http::{header, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tower_http::cors::{AllowHeaders, AllowMethods, AllowOrigin, CorsLayer};
use tracing::warn;
use uuid::Uuid;

use crate::config::CorsConfig;

// ---------------------------------------------------------------------------
// X-Request-ID middleware
// ---------------------------------------------------------------------------

/// Injects an `X-Request-ID` header into every request if one is not already
/// present, and copies it to the response.
pub async fn request_id(mut req: Request, next: Next) -> Response {
    let request_id = req
        .headers()
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(String::from)
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    req.headers_mut().insert(
        "x-request-id",
        HeaderValue::from_str(&request_id).unwrap_or_else(|_| HeaderValue::from_static("unknown")),
    );

    let mut resp = next.run(req).await;

    resp.headers_mut().insert(
        "x-request-id",
        HeaderValue::from_str(&request_id).unwrap_or_else(|_| HeaderValue::from_static("unknown")),
    );

    resp
}

// ---------------------------------------------------------------------------
// Auth passthrough middleware
// ---------------------------------------------------------------------------

/// Forwards authorization-related headers from the incoming request to the
/// upstream without modification.  This is a passthrough — the gateway does
/// not validate tokens; the upstream service is responsible for authn/authz.
///
/// Headers forwarded:
///   - Authorization
///   - Cookie
///   - X-Forwarded-User
///   - X-Api-Key
pub async fn auth_passthrough(req: Request, next: Next) -> Response {
    // Nothing to strip or inject — we simply allow these headers through.
    // The proxy handler copies all original headers, so the main purpose of
    // this middleware is documenting the contract and providing a hook for
    // future auth logic (e.g. JWT validation, header rewriting).
    next.run(req).await
}

// ---------------------------------------------------------------------------
// Token-bucket rate limiter
// ---------------------------------------------------------------------------

/// A simple in-memory token-bucket rate limiter.
///
/// Each bucket is keyed by an arbitrary string (e.g. route path prefix, client
/// IP, API key).  Tokens refill at `refill_rate` per second up to `capacity`.
#[derive(Clone)]
pub struct RateLimiter {
    buckets: Arc<Mutex<HashMap<String, Bucket>>>,
    refill_rate: f64,
    capacity: f64,
}

struct Bucket {
    tokens: f64,
    last_refill: std::time::Instant,
}

impl RateLimiter {
    /// Create a new rate limiter.
    ///
    /// * `requests_per_second` — sustained rate
    /// * `burst` — maximum burst size (bucket capacity)
    pub fn new(requests_per_second: u32, burst: u32) -> Self {
        Self {
            buckets: Arc::new(Mutex::new(HashMap::new())),
            refill_rate: requests_per_second as f64,
            capacity: burst as f64,
        }
    }

    /// Try to acquire a token for the given `key`.
    /// Returns `true` if the request is allowed, `false` if rate-limited.
    pub async fn try_acquire(&self, key: &str) -> bool {
        let mut buckets = self.buckets.lock().await;
        let now = std::time::Instant::now();

        let bucket = buckets.entry(key.to_string()).or_insert_with(|| Bucket {
            tokens: self.capacity,
            last_refill: now,
        });

        // Refill tokens based on elapsed time.
        let elapsed = now.duration_since(bucket.last_refill).as_secs_f64();
        bucket.tokens = (bucket.tokens + elapsed * self.refill_rate).min(self.capacity);
        bucket.last_refill = now;

        if bucket.tokens >= 1.0 {
            bucket.tokens -= 1.0;
            true
        } else {
            false
        }
    }
}

/// Axum middleware that enforces rate limiting.
///
/// The rate limiter is keyed by the matched route path prefix.  If no route
/// has been matched yet (i.e. the rate limiter runs before routing), the full
/// request path is used as the key.
pub async fn rate_limit(
    axum::extract::State(limiter): axum::extract::State<Option<RateLimiter>>,
    req: Request,
    next: Next,
) -> Response {
    if let Some(ref limiter) = limiter {
        let key = req.uri().path().to_string();
        if !limiter.try_acquire(&key).await {
            warn!(path = %key, "rate limit exceeded");
            return (
                StatusCode::TOO_MANY_REQUESTS,
                [(header::RETRY_AFTER, "1")],
                "rate limit exceeded",
            )
                .into_response();
        }
    }
    next.run(req).await
}

// ---------------------------------------------------------------------------
// CORS layer builder
// ---------------------------------------------------------------------------

/// Build a `tower_http::cors::CorsLayer` from our config type.
pub fn build_cors_layer(config: &CorsConfig) -> CorsLayer {
    let origins = if config.allowed_origins.iter().any(|o| o == "*") {
        AllowOrigin::any()
    } else {
        let origins: Vec<HeaderValue> = config
            .allowed_origins
            .iter()
            .filter_map(|o| HeaderValue::from_str(o).ok())
            .collect();
        AllowOrigin::list(origins)
    };

    let methods: Vec<axum::http::Method> = config
        .allowed_methods
        .iter()
        .filter_map(|m| m.parse().ok())
        .collect();

    let headers: Vec<axum::http::HeaderName> = config
        .allowed_headers
        .iter()
        .filter_map(|h| h.parse().ok())
        .collect();

    let mut layer = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods(AllowMethods::list(methods))
        .allow_headers(AllowHeaders::list(headers))
        .max_age(Duration::from_secs(config.max_age_secs));

    if config.allow_credentials {
        layer = layer.allow_credentials(true);
    }

    layer
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limiter_allows_burst() {
        let limiter = RateLimiter::new(10, 5);
        // Should allow up to 5 (burst) requests immediately.
        for _ in 0..5 {
            assert!(limiter.try_acquire("test").await);
        }
        // The 6th should be denied.
        assert!(!limiter.try_acquire("test").await);
    }

    #[tokio::test]
    async fn test_rate_limiter_separate_keys() {
        let limiter = RateLimiter::new(1, 1);
        assert!(limiter.try_acquire("a").await);
        assert!(limiter.try_acquire("b").await);
        // Same key again — denied.
        assert!(!limiter.try_acquire("a").await);
    }

    #[test]
    fn test_build_cors_wildcard() {
        let config = CorsConfig::default();
        let _layer = build_cors_layer(&config);
        // Smoke test — just verify it doesn't panic.
    }

    #[test]
    fn test_build_cors_specific_origins() {
        let config = CorsConfig {
            allowed_origins: vec![
                "https://example.com".to_string(),
                "https://app.example.com".to_string(),
            ],
            ..Default::default()
        };
        let _layer = build_cors_layer(&config);
    }
}
