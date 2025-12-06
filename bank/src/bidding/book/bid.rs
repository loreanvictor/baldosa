use std::string::ToString;

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::types::Uuid;

use super::super::config::Config;
use super::coords::Coords;
use crate::wallet::Transaction;

// FIxME: bid content's title and image should not be optional.
//        this, however, will need error handling on the db extraction
//        point, or some intermediary struct to extract from db and then
//        check to proper bid content with error handling.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BidContent {
  pub image: Option<String>,
  pub description: Option<String>,
  pub title: Option<String>,
  pub subtitle: Option<String>,
  pub url: Option<String>,
}

impl From<Value> for BidContent {
  fn from(value: Value) -> Self {
    BidContent {
      image: value["image"].as_str().map(ToString::to_string),
      description: value["description"].as_str().map(ToString::to_string),
      title: value["title"].as_str().map(ToString::to_string),
      subtitle: value["subtitle"].as_str().map(ToString::to_string),
      url: value["url"].as_str().map(ToString::to_string),
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bid {
  pub id: Uuid,
  pub bidder: Uuid,
  pub tx: Uuid,
  pub x: i32,
  pub y: i32,
  pub content: BidContent,
  pub amount: i32,
  pub created_at: DateTime<Utc>,
  pub published_at: Option<DateTime<Utc>>,
  pub rejection: Option<Value>,
}

impl Bid {
  #[allow(dead_code)]
  pub fn coords(&self) -> Coords {
    Coords {
      x: self.x,
      y: self.y,
    }
  }
}

pub fn next_auction_time(occupant: Option<&Bid>, config: &Config) -> Option<DateTime<Utc>> {
  if occupant.is_none()
    || occupant.unwrap().published_at.is_none()
    || Utc::now() - occupant.unwrap().published_at.unwrap()
      > Duration::from_std(config.guaranteed_occupancy).unwrap_or_default()
  {
    None
  } else {
    occupant
      .and_then(|bid| bid.published_at)
      .map(|published_at| published_at + config.guaranteed_occupancy)
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingBid {
  pub bid: Bid,
  pub occupant: Option<Bid>,
  pub next_auction: Option<DateTime<Utc>>,
}

impl PendingBid {
  pub fn populate_next_auction(&mut self, config: &Config) {
    self.next_auction = next_auction_time(self.occupant.as_ref(), config);
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinningBid {
  pub bid: Bid,
  pub transaction: Transaction,
}
