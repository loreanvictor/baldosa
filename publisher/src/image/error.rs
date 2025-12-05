use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

use super::io::error::ImageIoError;

#[derive(Error, Debug)]
pub enum ImageError {
  #[error("Invalid coordinates")]
  InvalidCoordinates,
  #[error("Image IO error: {0}")]
  IoError(#[from] ImageIoError),
  #[error("Join error: {0}")]
  JoinError(#[from] tokio::task::JoinError),
}

impl IntoResponse for ImageError {
  fn into_response(self) -> Response {
    match self {
      ImageError::InvalidCoordinates => {
        (StatusCode::BAD_REQUEST, "Invalid coordinates").into_response()
      }
      ImageError::JoinError(_) => {
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
      }
      ImageError::IoError(io_error) => io_error.into_response(),
    }
  }
}
