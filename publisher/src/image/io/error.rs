use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

use super::meta::MetadataValidationErrors;

#[derive(Error, Debug)]
pub enum ImageIoError {
  #[allow(dead_code)]
  #[error("Unknown error: {0}")]
  Unknown(Box<dyn std::error::Error + Send + Sync>),
  #[error("Image not found")]
  NotFound,
  #[error("Invalid image format")]
  InvalidFormat,
  #[error("Failed to read image: {0}")]
  ReadError(Box<dyn std::error::Error + Send + Sync>),
  #[error("Failed to write image: {0}")]
  WriteError(Box<dyn std::error::Error + Send + Sync>),
  #[error("Failed to write image: {0}")]
  DeleteError(Box<dyn std::error::Error + Send + Sync>),
  #[error("Invalid metadata {0}")]
  InvalidMetadata(MetadataValidationErrors),
}

impl IntoResponse for ImageIoError {
  fn into_response(self) -> Response {
    (match self {
      ImageIoError::Unknown(_) => (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Unknown error".to_string(),
      ),
      ImageIoError::NotFound => (StatusCode::NOT_FOUND, "Image not found".to_string()),
      ImageIoError::InvalidFormat => (
        StatusCode::UNPROCESSABLE_ENTITY,
        "Invalid image format".to_string(),
      ),
      ImageIoError::ReadError(_) => (StatusCode::BAD_REQUEST, "Failed to read image".to_string()),
      ImageIoError::WriteError(_) => (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Failed to write image".to_string(),
      ),
      ImageIoError::DeleteError(_) => (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Failed to delete image".to_string(),
      ),
      ImageIoError::InvalidMetadata(err) => (
        StatusCode::BAD_REQUEST,
        format!("Invalid metadata. {}", err),
      ),
    })
    .into_response()
  }
}
