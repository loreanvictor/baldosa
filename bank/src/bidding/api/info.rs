use axum::{
  extract::{Extension, Json, Path},
  response::IntoResponse,
};
use chrono::{DateTime, Duration, Utc};
use serde::Serialize;

use super::super::bid::Bid;
use super::super::book::Book;
use super::super::config::Config;
use super::super::coords::Coords;
use super::super::error::BiddingError;
use super::validate::validate_coords;

pub fn should_publish_immediately(occupant: Option<&Bid>, config: &Config) -> bool {
  occupant.is_none()
    || occupant.unwrap().published_at.is_none()
    || Utc::now() - occupant.unwrap().published_at.unwrap()
      > Duration::from_std(config.guaranteed_occupancy).unwrap_or_default()
}

#[derive(Serialize, Debug)]
pub struct BiddingInfo {
  pub last_bid: Option<Bid>,
  pub next_auction: Option<DateTime<Utc>>,
}

pub async fn bidding_info(
  Extension(book): Extension<Book>,
  Extension(config): Extension<Config>,
  Path(coords): Path<Coords>,
) -> Result<impl IntoResponse, BiddingError> {
  validate_coords(coords, &config)?;
  let Ok(occupant) = book.get_occupant_bid(coords).await else {
    return Err(BiddingError::Unknown);
  };

  Ok(Json(BiddingInfo {
    next_auction: if should_publish_immediately(occupant.as_ref(), &config) {
      None
    } else {
      Some(occupant.as_ref().unwrap().published_at.unwrap() + config.guaranteed_occupancy)
    },
    last_bid: occupant,
  }))
}
