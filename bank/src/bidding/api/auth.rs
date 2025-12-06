use axum::{
  extract::{Extension, FromRequestParts, Path},
  http::request::Parts,
  response::{IntoResponse, Response},
};
use sqlx::types::Uuid;

use super::super::book::{Bid, Book, Coords};
use super::super::error::BiddingError;
use crate::auth::AuthenticatedUser;

pub struct OwnedBidById(pub Bid, pub AuthenticatedUser);

impl<S> FromRequestParts<S> for OwnedBidById
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let id = Path::<String>::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)
      .and_then(|Path(id)| {
        Uuid::parse_str(&id).map_err(|_| BiddingError::UnauthorizedBid.into_response())
      })?;
    let Extension(book) = Extension::<Book>::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;
    let bidder = AuthenticatedUser::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;

    let bid = book
      .get_bid(&id)
      .await
      .map_err(|_| BiddingError::IncorrectTransaction.into_response())?;

    if bid.bidder != bidder.id {
      return Err(BiddingError::UnauthorizedBid.into_response());
    }

    Ok(OwnedBidById(bid, bidder))
  }
}

#[allow(unused)]
pub struct OwnedLiveBidByCoords(pub Bid, pub AuthenticatedUser);

impl<S> FromRequestParts<S> for OwnedLiveBidByCoords
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let Path(coords) = Path::<Coords>::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;
    let Extension(book) = Extension::<Book>::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;
    let bidder = AuthenticatedUser::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;

    let bid = book
      .get_occupant_bid(coords)
      .await
      .map_err(|_| BiddingError::Unknown.into_response())?;

    if let Some(bid) = bid {
      if bid.bidder != bidder.id {
        return Err(BiddingError::UnauthorizedCoords.into_response());
      }

      Ok(OwnedLiveBidByCoords(bid, bidder))
    } else {
      Err(BiddingError::UnauthorizedBid.into_response())
    }
  }
}
