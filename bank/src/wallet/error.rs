use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WalletError {
  #[error("Unknown error")]
  Unknown,
  #[error("Insufficient funds")]
  InsufficientFunds,
  #[error("Transaction already used")]
  AlreadyUsedTransaction,
  #[error("Transaction not found")]
  TransactionNotFound,
  #[error("Unauthorized transaction")]
  UnauthorizedTransaction,
  #[error("Erroneous transaction")]
  ErroneousTransaction,
}

impl IntoResponse for WalletError {
  fn into_response(self) -> Response {
    (match self {
      WalletError::Unknown => (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error"),
      WalletError::InsufficientFunds => (StatusCode::FORBIDDEN, "Insufficient funds"),
      WalletError::UnauthorizedTransaction => {
        (StatusCode::UNAUTHORIZED, "Unauthorized transaction")
      }
      WalletError::AlreadyUsedTransaction => (StatusCode::CONFLICT, "Transaction already used"),
      WalletError::TransactionNotFound => (StatusCode::NOT_FOUND, "Transaction not found"),
      WalletError::ErroneousTransaction => (StatusCode::BAD_REQUEST, "Erroneous transaction"),
    })
    .into_response()
  }
}
