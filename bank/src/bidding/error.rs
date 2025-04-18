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
  #[error("Already Earmarked")]
  AlreadyEarmarked,
  #[error("Unauthorized Transaction")]
  UnauthorizedTransaction,
}

impl IntoResponse for BiddingError {
  fn into_response(self) -> Response {
    (match self {
      BiddingError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error"),
      BiddingError::InsufficientFunds => (StatusCode::FORBIDDEN, "Insufficient funds"),
      BiddingError::InvalidBid => (StatusCode::BAD_REQUEST, "Invalid bid"),
      BiddingError::AlreadyEarmarked => (StatusCode::CONFLICT, "Transaction already earmarked"),
      BiddingError::UnauthorizedTransaction => {
        (StatusCode::UNAUTHORIZED, "Unauthorized transaction")
      }
    })
    .into_response()
  }
}
