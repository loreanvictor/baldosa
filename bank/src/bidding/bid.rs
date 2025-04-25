use std::string::ToString;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::types::Uuid;

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
  pub fn coords(&self) -> (i32, i32) {
    (self.x, self.y)
  }
}
