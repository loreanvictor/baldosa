use std::{ env, sync::Arc };
use axum::{
  routing::{ put, delete }, Extension, Router
};

use log::info;
use env_logger;

mod auth;
mod config;
mod s3;
mod image;
mod db;
mod cartography;

use image::api::{ publish_handler, unpublish_handler };
use image::io::S3JpegInterface as IO;
use cartography::DefaultMapStorage as Map;


#[tokio::main]
async fn main() {
  dotenv::dotenv().ok();
  env_logger::init();

  let config = config::init().await;
  let s3client = s3::init().await;
  let db = db::init().await;

  let io = IO::new(s3client.clone(), None, None);
  let map = cartography::init(db, s3client);

  info!("starting server");

  let app = auth::protect(
    Router::new()
      .route("/{coords}", put(publish_handler::<IO, Map>))
      .route("/{coords}", delete(unpublish_handler::<IO, Map>))
      .layer(Extension(Arc::new(config)))
      .layer(Extension(Arc::new(io)))
      .layer(Extension(Arc::new(map)))
  );

  let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
  let port = env::var("PORT").ok().and_then(|p| p.parse::<u16>().ok()).unwrap_or(8080);
  let addr = format!("{}:{}", host, port);

  info!("serving on {}", addr);

  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
