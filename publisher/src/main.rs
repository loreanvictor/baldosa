use std::sync::Arc;
use axum::{
  routing::{ put, delete }, Extension, Router
};

use log::info;

mod env;
mod config;
mod s3;
mod db;
mod auth;
mod image;
mod cartography;

use image::api::{ publish_handler, unpublish_handler };
use image::io::DefaultImageInterface as IO;
use cartography::DefaultMapStorage as Map;


#[tokio::main]
async fn main() {
  env::init().ok();

  let config = config::init().await;
  let s3client = s3::init().await;
  let db = db::init().await;

  let io = image::io::init(s3client.clone());
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

  let host = std::env::var("HOST").unwrap_or("127.0.0.1".to_string());
  let port = std::env::var("PORT").ok().and_then(|p| p.parse::<u16>().ok()).unwrap_or(8080);
  let addr = format!("{}:{}", host, port);

  info!("serving on {}", addr);

  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
