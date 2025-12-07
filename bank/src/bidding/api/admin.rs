use axum::{
  extract::{Extension, FromRequestParts, Path},
  http::request::Parts,
  response::{IntoResponse, Response},
};
use sqlx::types::Uuid;

use super::super::book::{Bid, Book, Coords};
use super::super::error::BiddingError;
use crate::auth::admin::AdminUser;

#[allow(unused)]
pub struct BidByIdForAdmin(pub Bid, pub AdminUser);

impl<S> FromRequestParts<S> for BidByIdForAdmin
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
    let admin = AdminUser::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;

    let bid = book
      .get_bid(&id)
      .await
      .map_err(|_| BiddingError::NotFound.into_response())?;

    Ok(BidByIdForAdmin(bid, admin))
  }
}

#[allow(unused)]
pub struct LiveBidByCoordsForAdmin(pub Bid, pub AdminUser);

impl<S> FromRequestParts<S> for LiveBidByCoordsForAdmin
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
    let admin = AdminUser::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;

    let bid = book
      .get_occupant_bid(&coords)
      .await
      .map_err(|_| BiddingError::Unknown.into_response())?;

    if let Some(bid) = bid {
      Ok(LiveBidByCoordsForAdmin(bid, admin))
    } else {
      Err(BiddingError::NotFound.into_response())
    }
  }
}
