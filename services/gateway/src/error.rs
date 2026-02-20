use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::fmt;

// ---------------------------------------------------------------------------
// Gateway error type
// ---------------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum GatewayError {
    #[error("no route matched for path: {0}")]
    RouteNotFound(String),

    #[error("upstream unavailable: {0}")]
    UpstreamUnavailable(String),

    #[error("upstream returned an error: {status}")]
    UpstreamError { status: StatusCode, body: String },

    #[error("request timeout")]
    Timeout,

    #[error("rate limit exceeded")]
    RateLimited,

    #[error("configuration error: {0}")]
    Config(String),

    #[error("websocket error: {0}")]
    WebSocket(String),

    #[error(transparent)]
    Internal(#[from] anyhow::Error),
}

// We don't pull in `anyhow` as a top-level dep; implement From<reqwest::Error>
// and a few other common conversions by hand so the proxy code stays clean.

impl From<reqwest::Error> for GatewayError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            GatewayError::Timeout
        } else {
            GatewayError::UpstreamUnavailable(err.to_string())
        }
    }
}

impl From<url::ParseError> for GatewayError {
    fn from(err: url::ParseError) -> Self {
        GatewayError::Config(format!("invalid URL: {err}"))
    }
}

// ---------------------------------------------------------------------------
// JSON error response body
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: ErrorBody,
}

#[derive(Debug, Serialize)]
pub struct ErrorBody {
    pub code: u16,
    pub status: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

impl fmt::Display for ErrorResponse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.error.message)
    }
}

// ---------------------------------------------------------------------------
// IntoResponse — so we can use GatewayError as an axum handler return type
// ---------------------------------------------------------------------------

impl IntoResponse for GatewayError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            GatewayError::RouteNotFound(path) => (
                StatusCode::NOT_FOUND,
                format!("No route matched for path: {path}"),
            ),
            GatewayError::UpstreamUnavailable(detail) => (
                StatusCode::BAD_GATEWAY,
                format!("Upstream service unavailable: {detail}"),
            ),
            GatewayError::UpstreamError { status, body } => {
                (*status, format!("Upstream error: {body}"))
            }
            GatewayError::Timeout => (
                StatusCode::GATEWAY_TIMEOUT,
                "Request to upstream timed out".to_string(),
            ),
            GatewayError::RateLimited => (
                StatusCode::TOO_MANY_REQUESTS,
                "Rate limit exceeded — try again later".to_string(),
            ),
            GatewayError::Config(detail) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Configuration error: {detail}"),
            ),
            GatewayError::WebSocket(detail) => (
                StatusCode::BAD_REQUEST,
                format!("WebSocket error: {detail}"),
            ),
            GatewayError::Internal(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Internal error: {err}"),
            ),
        };

        let body = ErrorResponse {
            error: ErrorBody {
                code: status.as_u16(),
                status: status.canonical_reason().unwrap_or("Unknown").to_string(),
                message,
                request_id: None, // filled by middleware when available
            },
        };

        (status, Json(body)).into_response()
    }
}

// ---------------------------------------------------------------------------
// Helper to build an ErrorResponse with a request-id already attached
// ---------------------------------------------------------------------------

impl ErrorResponse {
    #[allow(dead_code)]
    pub fn with_request_id(mut self, id: impl Into<String>) -> Self {
        self.error.request_id = Some(id.into());
        self
    }
}
