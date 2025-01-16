use std::sync::Arc;
use axum::{
  routing::{ put, delete }, Extension, Router
};

use log::info;
use env_logger;

mod auth;
mod config;
mod s3;
mod image;

use image::api::{ publish_handler, unpublish_handler };
use image::io::S3JpegInterface as IO;


#[tokio::main]
async fn main() {
  dotenv::dotenv().ok();
  env_logger::init();

  let config = config::init().await;
  let io = IO::new(s3::init().await, None, None);

  info!("starting server");

  let app = auth::protect(
    Router::new()
      .route("/{coords}", put(publish_handler::<IO>))
      .route("/{coords}", delete(unpublish_handler::<IO>))
      .layer(Extension(Arc::new(config)))
      .layer(Extension(Arc::new(io)))
  );

  let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
