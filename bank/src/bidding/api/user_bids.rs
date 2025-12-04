use axum::{
  extract::{Extension, Json, Query},
  response::IntoResponse,
};
use log::error;
use serde::Deserialize;

use super::super::book::Book;
use super::super::config::Config;
use super::super::error::BiddingError;
use crate::auth::AuthenticatedUser;

#[derive(Deserialize)]
pub struct Pagination {
  pub offset: Option<u32>,
  pub limit: Option<u32>,
}

pub async fn live_bids(
  Extension(book): Extension<Book>,
  Query(Pagination { offset, limit }): Query<Pagination>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, BiddingError> {
  let bids = book
    .get_user_published_bids(&user, offset.unwrap_or(0), limit.unwrap_or(32))
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(Json(bids))
}

pub async fn pending_bids(
  Extension(book): Extension<Book>,
  Extension(config): Extension<Config>,
  Query(Pagination { offset, limit }): Query<Pagination>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, BiddingError> {
  let mut pending = book
    .get_user_pending_bids(&user, offset.unwrap_or(0), limit.unwrap_or(32))
    .await
    .map_err(|err| {
      error!("Can't retrieve user's pending bids {:#}", err);
      BiddingError::Unknown
    })?;

  for p in &mut pending {
    p.populate_next_auction(&config);
  }

  Ok(Json(pending))
}

pub async fn all_bids(
  Extension(book): Extension<Book>,
  Query(Pagination { offset, limit }): Query<Pagination>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, BiddingError> {
  let bids = book
    .get_all_user_bids(&user, offset.unwrap_or(0), limit.unwrap_or(32))
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(Json(bids))
}
