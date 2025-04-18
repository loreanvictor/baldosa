use std::collections::HashMap;

use axum::{
  extract::{Extension, Json, Path},
  response::IntoResponse,
};
use s3::bucket::Bucket;
use serde::{Deserialize, Serialize};
use sqlx::types::Uuid;

use super::super::bid::BidContent;
use super::super::book::Book;
use super::super::error::BiddingError;
use super::super::publisher::Publisher;
use super::super::upload;
use super::super::util::parse_coords;
use super::publish::publish;
use super::validate::validate_bid;
use crate::auth::AuthenticatedUser;
use crate::wallet::{auth::UsableOutgoingOffer, Ledger};

#[derive(Serialize)]
pub struct InitResponse {
  upload_url: String,
  upload_fields: HashMap<String, String>,
}

pub async fn init_bid(
  Extension(bucket): Extension<Bucket>,
  Extension(book): Extension<Book>,
  Extension(config): Extension<upload::Config>,
  Path(coords): Path<String>,
  UsableOutgoingOffer(tx, bidder): UsableOutgoingOffer,
) -> Result<impl IntoResponse, BiddingError> {
  let coords = parse_coords(&coords).map_err(|_| BiddingError::InvalidBid)?;
  validate_bid(&book, &tx, &bidder, coords).await?;

  match upload::generate_url(&bucket, coords, &tx, &config).await {
    Ok(res) => Ok(Json(InitResponse {
      upload_url: res.url.to_string(),
      upload_fields: res.fields,
    })),
    Err(_) => Err(BiddingError::Unknown),
  }
}

#[derive(Deserialize)]
pub struct PostBidBody {
  title: String,
  subtitle: String,
  description: String,
  url: String,
  image: String,
  transaction_id: Uuid,
}

pub async fn post_bid(
  Extension(book): Extension<Book>,
  Extension(ledger): Extension<Ledger>,
  Extension(publisher): Extension<Publisher>,
  bidder: AuthenticatedUser,
  Path(coords): Path<String>,
  Json(body): Json<PostBidBody>,
) -> Result<impl IntoResponse, BiddingError> {
  let coords = parse_coords(&coords).map_err(|_| BiddingError::InvalidBid)?;
  let tx = ledger
    .get_transaction(&body.transaction_id)
    .await
    .map_err(|_| BiddingError::InvalidBid)?;
  validate_bid(&book, &tx, &bidder, coords).await?;

  match book
    .record(
      &tx,
      coords,
      BidContent {
        title: Some(body.title),
        subtitle: Some(body.subtitle),
        description: Some(body.description),
        url: Some(body.url),
        image: Some(body.image),
      },
      tx.total() as i32,
    )
    .await
  {
    Ok(mut bid) => {
      if book
        .is_tile_vacant(coords)
        .await
        .map_err(|_| BiddingError::Unknown)?
      {
        publish(&mut bid, &tx, &book, &publisher, &ledger).await?;
      }
      Ok(Json(bid))
    }
    Err(_) => Err(BiddingError::Unknown),
  }
}
