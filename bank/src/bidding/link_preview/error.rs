use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum LinkPreviewError {
  #[error("Bad request")]
  BadRequest,
  #[error("Nov verifiable API key")]
  Unauthorized,
  #[error("Invalid API key")]
  ForbiddenKey,
  #[error("Blocked by robots.txt of target website")]
  BlockedByRobots,
  #[error("Blocked by content safety filter")]
  BlockedByContentSafety,
  #[error("Invalid upstream response status: {0}")]
  InvalidUpstreamStatus(StatusCode),
  #[error("Rate limit for domain exceeded")]
  DomainRateLimited,
  #[error("Rate limit for account exceeded")]
  AccountRateLimited,
  #[error("Request failed")]
  RequestFailed(#[from] reqwest::Error),
}

impl LinkPreviewError {
  pub fn from_status(status: StatusCode) -> Self {
    match status.as_u16() {
      400 => Self::BadRequest,
      401 => Self::Unauthorized,
      403 => Self::ForbiddenKey,
      423 => Self::BlockedByRobots,
      424 => Self::BlockedByContentSafety,
      425 => Self::InvalidUpstreamStatus(status),
      426 => Self::DomainRateLimited,
      429 => Self::AccountRateLimited,
      _ => Self::InvalidUpstreamStatus(status),
    }
  }
}

impl IntoResponse for LinkPreviewError {
  fn into_response(self) -> Response {
    (match self {
      Self::BadRequest => (
        StatusCode::BAD_REQUEST,
        "Invalid preview request.".to_string(),
      ),
      Self::Unauthorized => (
        StatusCode::UNAUTHORIZED,
        "Need a valid link preview API key.".to_string(),
      ),
      Self::ForbiddenKey => (
        StatusCode::FORBIDDEN,
        "Link preview API key is wrong.".to_string(),
      ),
      Self::BlockedByRobots => (
        StatusCode::UNPROCESSABLE_ENTITY,
        "Target website rejected request via robots.txt".to_string(),
      ),
      Self::BlockedByContentSafety => (
        StatusCode::UNPROCESSABLE_ENTITY,
        "Content is not safe.".to_string(),
      ),
      Self::InvalidUpstreamStatus(status) => (
        StatusCode::BAD_GATEWAY,
        format!("Target website responded confusingly with {}", status),
      ),
      Self::DomainRateLimited => (
        StatusCode::TOO_MANY_REQUESTS,
        "Please don't spam target website".to_string(),
      ),
      Self::AccountRateLimited => (
        StatusCode::TOO_MANY_REQUESTS,
        "Preview service deemed us too poor for these many requests.".to_string(),
      ),
      Self::RequestFailed(err) => (
        StatusCode::BAD_GATEWAY,
        format!("Failed to talk with preview service: {}", err),
      ),
    })
    .into_response()
  }
}
