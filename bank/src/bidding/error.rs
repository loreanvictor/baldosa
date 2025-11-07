use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum BiddingError {
  #[error("Unknown error")]
  Unknown,
  #[error("Insufficient funds")]
  InsufficientFunds,
  #[error("Invalid bid")]
  InvalidBid,
  #[error("Unauthorized bid")]
  UnauthorizedBid,
  #[error("Already Earmarked")]
  AlreadyEarmarked,
  #[error("Unauthorized Transaction")]
  UnauthorizedTransaction,
  #[error("Unauthorized Coordinates")]
  UnauthorizedCoords,
}

impl IntoResponse for BiddingError {
  fn into_response(self) -> Response {
    (match self {
      BiddingError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error"),
      BiddingError::InsufficientFunds => (StatusCode::FORBIDDEN, "Insufficient funds"),
      BiddingError::InvalidBid => (StatusCode::BAD_REQUEST, "Invalid bid"),
      BiddingError::UnauthorizedBid => (StatusCode::UNAUTHORIZED, "Unauthorized bid"),
      BiddingError::AlreadyEarmarked => (StatusCode::CONFLICT, "Transaction already earmarked"),
      BiddingError::UnauthorizedTransaction => {
        (StatusCode::UNAUTHORIZED, "Unauthorized transaction")
      }
      BiddingError::UnauthorizedCoords => (StatusCode::UNAUTHORIZED, "Unauthorized coordinates"),
    })
    .into_response()
  }
}
