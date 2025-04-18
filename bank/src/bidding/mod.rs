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
mod bid;
mod book;
pub mod error;
mod publisher;
mod tile_account;
mod upload;
mod util;

pub fn router(db: &Pool<Postgres>) -> Router {
  let cors = CorsLayer::new()
    .allow_methods(Any)
    .allow_headers(Any)
    .allow_origin(Any);

  let ledger = Ledger::new(db.clone());
  let book = Book::new(db.clone());
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

  let uploadconf = upload::Config::image_config_from_env();

  Router::new()
    .route("/", get(|| async { "Not Implemented" })) // --> get my bids
    .route("/live", get(|| async { "Not Implemented" })) // --> get my currently published bids
    .route("/history", get(|| async { "Not Implemented" })) // --> get the history of all my bids
    .route("/{coords}", get(|| async { "Not Implemented" })) // --> get bidding info for a tile
    .route("/{coords}/init", post(api::init_bid)) // --> initiate a bid on a tile
    .route("/{coords}", post(api::post_bid)) // --> finalize bid on a tile
    .route("/{coords}", delete(|| async { "Not Implemented" })) // --> rescind bid, unpublish if need be
    .layer(Extension(ledger))
    .layer(Extension(book))
    .layer(Extension(publisher))
    .layer(Extension(*bucket))
    .layer(Extension(uploadconf))
    .layer(cors)
}
