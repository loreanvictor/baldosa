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
use super::super::coords::Coords;
use super::super::error::BiddingError;
use super::super::publisher::Publisher;
use super::super::upload;
use super::publish::publish;
use super::validate::validate_bid;
use super::{super::config::Config, info::should_publish_immediately};
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
  Extension(config): Extension<Config>,
  Path(coords): Path<Coords>,
  UsableOutgoingOffer(tx, bidder): UsableOutgoingOffer,
) -> Result<impl IntoResponse, BiddingError> {
  validate_bid(&book, &tx, &bidder, coords, &config).await?;

  match upload::generate_url(&bucket, coords, &tx, &config.image_upload).await {
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
  Extension(config): Extension<Config>,
  bidder: AuthenticatedUser,
  Path(coords): Path<Coords>,
  Json(body): Json<PostBidBody>,
) -> Result<impl IntoResponse, BiddingError> {
  let tx = ledger
    .get_transaction(&body.transaction_id)
    .await
    .map_err(|_| BiddingError::InvalidBid)?;
  validate_bid(&book, &tx, &bidder, coords, &config).await?;

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
      i32::try_from(tx.total()).unwrap_or_default(),
    )
    .await
  {
    Ok(mut bid) => {
      let Ok(occupant) = book.get_occupant_bid(coords).await else {
        return Err(BiddingError::Unknown);
      };

      if should_publish_immediately(occupant.as_ref(), &config) {
        publish(&mut bid, &tx, &book, &publisher, &ledger).await?;
      }

      Ok(Json(bid))
    }
    Err(_) => Err(BiddingError::Unknown),
  }
}
