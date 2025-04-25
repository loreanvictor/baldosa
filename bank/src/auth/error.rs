use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

///
/// Represents an error that can occur during
/// authentication / registration / verification.
///
#[derive(Error, Debug)]
pub enum AuthError {
  /// We don't know what happened? Typically something went wrong.
  #[error("Unknown error")]
  Unknown,
  /// The user session is corrupted, e.g. they should have initiated
  /// a registration process but didn't.
  #[error("Corrupted session")]
  CorruptSession,
  /// The user provided invalid credentials (e.g. wrong passkeys, passwords, etc.)
  #[error("Invalid credentials")]
  InvalidCredentials,
  /// The user already exists (e.g. during registration)
  #[error("User already exists")]
  UserExists,
  /// The user has already been verified (through some verification process, e.g. email)
  #[error("Requested verification already complete")]
  AlreadyVerified,
  /// The user was not found (for example for logging in)
  #[error("User not found")]
  UserNotFound,
  /// The user is trying something too much (for example email verification)
  #[error("Too many attempts")]
  TooManyAttempts,
  /// The user doesn't have enough permissions (e.g. they aren't admin)
  #[error("Insufficient permissions")]
  InsufficientPermissions,
  /// Failed to deserialise session
  #[error("Deserialising session failed: {0}")]
  InvalidSessionState(#[from] tower_sessions::session::Error),

  /// The user has no passkeys
  #[allow(dead_code)]
  #[error("User has no credentials")]
  UserHasNoCredentials,
}

impl IntoResponse for AuthError {
  fn into_response(self) -> Response {
    (match self {
      AuthError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error"),
      AuthError::CorruptSession => (StatusCode::BAD_REQUEST, "Corrupted session"),
      AuthError::UserNotFound => (StatusCode::UNAUTHORIZED, "User not found"),
      AuthError::UserHasNoCredentials => (StatusCode::UNAUTHORIZED, "User has no credentials"),
      AuthError::InvalidSessionState(_) => {
        (StatusCode::BAD_REQUEST, "Deserialising session failed")
      }
      AuthError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid credentials"),
      AuthError::UserExists => (StatusCode::CONFLICT, "User already exists"),
      AuthError::AlreadyVerified => (
        StatusCode::CONFLICT,
        "Requested verification already complete",
      ),
      AuthError::TooManyAttempts => (StatusCode::TOO_MANY_REQUESTS, "Too many attempts"),
      AuthError::InsufficientPermissions => (StatusCode::FORBIDDEN, "Insufficient permissions"),
    })
    .into_response()
  }
}
