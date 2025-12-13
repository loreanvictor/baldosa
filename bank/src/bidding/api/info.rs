use axum::{
  extract::{Extension, Json, Path, Query},
  response::IntoResponse,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::auth::admin::AdminUser;

use super::super::book::{bid::next_auction_time, Bid, Book, Coords};
use super::super::config::Config;
use super::super::error::BiddingError;
use super::admin::LiveBidByCoordsForAdmin;
use super::validate::validate_coords;

#[derive(Serialize, Debug)]
pub struct BiddingInfo {
  pub last_bid: Option<Bid>,
  pub next_auction: Option<DateTime<Utc>>,
  pub minimum_bid: u32,
}

///
/// Returns information required for
/// bidding on a specific coordinate, including:
/// - The last winning bid on the coordinate (if any)
/// - The next auction time (`None` means as soon as possible)
/// - The minimum bid required to participate in the auction
///
pub async fn bidding_info(
  Extension(book): Extension<Book>,
  Extension(config): Extension<Config>,
  Path(coords): Path<Coords>,
) -> Result<impl IntoResponse, BiddingError> {
  validate_coords(coords, &config)?;
  let Ok(occupant) = book.get_occupant_bid(&coords).await else {
    return Err(BiddingError::Unknown);
  };

  // TODO: `last_bid` isn't necessarily the current occupant,
  //        the column should be separated and used as such.

  Ok(Json(BiddingInfo {
    next_auction: next_auction_time(occupant.as_ref(), &config),
    last_bid: occupant,
    minimum_bid: config.minimum_bid,
  }))
}

///
/// Returns the current occupant bid for the specified coordinates.
/// Requires admin authentication.
///
pub async fn occupant_bid(
  LiveBidByCoordsForAdmin(bid, _): LiveBidByCoordsForAdmin,
) -> Result<impl IntoResponse, BiddingError> {
  Ok(Json(bid))
}

#[derive(Deserialize)]
pub struct BidsPagination {
  pub offset: Option<u32>,
  pub limit: Option<u32>,
}

pub async fn all_live_bids(
  Extension(book): Extension<Book>,
  Query(BidsPagination { offset, limit }): Query<BidsPagination>,
  AdminUser(_): AdminUser,
) -> Result<impl IntoResponse, BiddingError> {
  book
    .all_live_bids(offset.unwrap_or(0), limit.unwrap_or(32))
    .await
    .map_err(|_| BiddingError::Unknown)
    .map(Json)
}
