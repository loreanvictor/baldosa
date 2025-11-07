use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PublishError {
  #[error("Unauthorized")]
  Unauthorized,
  #[error("Unknown error")]
  Unknown,
}

impl IntoResponse for PublishError {
  fn into_response(self) -> Response {
    (match self {
      PublishError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
      PublishError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error"),
    })
    .into_response()
  }
}
