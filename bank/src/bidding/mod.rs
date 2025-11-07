use std::env;

use axum::{
  extract::Extension,
  routing::{delete, get, post},
  Router,
};
use book::Book;
use publisher::Publisher;
use s3::{bucket::Bucket, creds::Credentials};
use sqlx::{postgres::Postgres, Pool};
use tower_http::cors::{Any, CorsLayer};

use super::wallet::Ledger;

mod api;
mod book;
pub mod config;
pub mod error;
pub mod auctions;
mod publisher;
mod tile;
mod upload;

pub fn router(config: config::Config, ledger: &Ledger, db: &Pool<Postgres>) -> Router {
  let cors = CorsLayer::new()
    .allow_methods(Any)
    .allow_headers(Any)
    .allow_origin(Any);

  let ledger = ledger.clone();
  let book = Book::new(config.clone(), db.clone());
  let publisher = Publisher::from_env();
  let bucket = Bucket::new(
    env::var("S3_SUBMIT_BUCKET")
      .expect("S3 not configured properly: missing S3_SUBMIT_BUCKET")
      .as_str(),
    env::var("AWS_REGION")
      .expect("S3 not configured properly: missing AWS_REGION")
      .parse()
      .unwrap(),
    Credentials::default().unwrap(),
  )
  .unwrap();

  Router::new()
    .route("/", get(api::pending_bids))
    .route("/live", get(api::live_bids))
    .route("/history", get(api::all_bids))
    .route("/{coords}", get(api::bidding_info))
    .route("/{coords}/init", post(api::init_bid))
    .route("/{coords}", post(api::post_bid))
    .route("/{coords}", delete(api::unpublish)) // --> unpublish a published bid
    .route("/{id}/rescind", delete(api::rescind_bid)) // --> rescind bid by id, if unpublished
    .route("/{coords}/reject", delete(api::reject)) // --> admin rejects a bid published to some coords
    .layer(Extension(ledger))
    .layer(Extension(book))
    .layer(Extension(publisher))
    .layer(Extension(*bucket))
    .layer(Extension(config))
    .layer(cors)
}
