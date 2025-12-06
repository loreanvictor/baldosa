use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
};
use serde::Serialize;
use std::fmt::{self, Display};
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Error)]
pub enum BidContentErrorKind {
  #[error("value is too long")]
  TooLong,
  #[error("invalid URL")]
  InvalidUrl,
}

#[derive(Debug, Clone, Serialize, Error)]
pub struct BiddingContentValidationErrors {
  pub title: Option<BidContentErrorKind>,
  pub subtitle: Option<BidContentErrorKind>,
  pub link: Option<BidContentErrorKind>,
  pub description: Option<BidContentErrorKind>,
}

impl BiddingContentValidationErrors {
  pub fn is_empty(&self) -> bool {
    self.title.is_none()
      && self.subtitle.is_none()
      && self.link.is_none()
      && self.description.is_none()
  }
}

impl Display for BiddingContentValidationErrors {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let mut first = true;

    let mut write_err = |field: &str, err: &Option<BidContentErrorKind>| -> fmt::Result {
      if let Some(e) = err {
        if !first {
          write!(f, "; ")?;
        }
        first = false;
        write!(f, "{}: {}", field, e)?;
      }
      Ok(())
    };

    write_err("title", &self.title)?;
    write_err("subtitle", &self.subtitle)?;
    write_err("link", &self.link)?;
    write_err("description", &self.description)?;

    if first {
      write!(f, "no validation errors")
    } else {
      Ok(())
    }
  }
}

#[derive(Error, Debug)]
pub enum BiddingError {
  #[error("Unknown error")]
  Unknown,
  #[error("Insufficient funds")]
  InsufficientFunds,
  #[error("Incorrect transaction")]
  IncorrectTransaction,
  #[error("Invalid content: {0}")]
  InvalidContent(#[from] BiddingContentValidationErrors),
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
      BiddingError::Unknown => (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Unknown error".to_string(),
      ),
      BiddingError::InsufficientFunds => (StatusCode::FORBIDDEN, "Insufficient funds".to_string()),
      BiddingError::IncorrectTransaction => {
        (StatusCode::BAD_REQUEST, "Incorrect transaction".to_string())
      }
      BiddingError::UnauthorizedBid => (StatusCode::UNAUTHORIZED, "Unauthorized bid".to_string()),
      BiddingError::AlreadyEarmarked => (
        StatusCode::CONFLICT,
        "Transaction already earmarked".to_string(),
      ),
      BiddingError::UnauthorizedTransaction => (
        StatusCode::UNAUTHORIZED,
        "Unauthorized transaction".to_string(),
      ),
      BiddingError::InvalidContent(errs) => (
        StatusCode::BAD_REQUEST,
        format!("Invalid content: {}", errs),
      ),
      BiddingError::UnauthorizedCoords => (
        StatusCode::UNAUTHORIZED,
        "Unauthorized coordinates".to_string(),
      ),
    })
    .into_response()
  }
}
