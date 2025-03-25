use axum::{
  http::StatusCode,
  response::{ IntoResponse, Response },
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthError {
  #[error("Unknown error")] Unknown,
  #[error("Corrupted session")] CorruptSession,
  #[error("Invalid credentials")] InvalidCredentials,
  #[error("User already exists")] UserExists,
  #[allow(dead_code)]
  #[error("User not found")] UserNotFound,
  #[allow(dead_code)]
  #[error("User has no credentials")] UserHasNoCredentials,
  #[error("Deserialising session failed: {0}")]
  InvalidSessionState(#[from] tower_sessions::session::Error),
}

impl IntoResponse for AuthError {
  fn into_response(self) -> Response {
    (
      match self {
        AuthError::CorruptSession => (StatusCode::BAD_REQUEST ,"Corrupted session"),
        AuthError::UserNotFound => (StatusCode::UNAUTHORIZED, "User not found"),
        AuthError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error"),
        AuthError::UserHasNoCredentials => (StatusCode::UNAUTHORIZED, "User has no credentials"),
        AuthError::InvalidSessionState(_) => (StatusCode::BAD_REQUEST, "Deserialising session failed"),
        AuthError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid credentials"),
        AuthError::UserExists => (StatusCode::CONFLICT, "User already exists"),
      }
    ).into_response()
  }
}
