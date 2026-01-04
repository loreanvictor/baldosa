#![allow(clippy::all)]

use std::sync::Arc;

use axum::{
  routing::{delete, post, put},
  Extension, Router,
};
use log::info;
use tower_http::cors::{Any, CorsLayer};

mod auth;
mod cartography;
mod config;
mod db;
mod env;
mod health;
mod image;
mod s3;

use cartography::DefaultMapStorage as Map;
use image::api::{publish_handler, rebuild_handler, unpublish_handler};
use image::io::DefaultImageInterface as IO;

#[tokio::main]
async fn main() {
  env::init().ok();

  let cors = CorsLayer::new()
    .allow_methods(Any)
    .allow_headers(Any)
    .allow_origin(Any);

  let config = config::init().await;
  let s3client = s3::init().await;
  let db = db::init().await;

  let (io, rebuild_io) = image::io::init(s3client.clone());
  let map = cartography::init(db, s3client);
  info!("starting server");

  let app = Router::new()
    .nest("/health", health::router())
    .merge(auth::protect(
      Router::new()
        .route("/{coords}", put(publish_handler::<IO, Map>))
        .route("/{coords}", delete(unpublish_handler::<IO, Map>))
        .layer(Extension(io))
        .layer(Extension(Arc::new(map))) // FIXME: this Arc is ugly and not needed
        .route(
          "/{coords}/rebuild",
          post(rebuild_handler::<IO>).layer(Extension(rebuild_io)),
        )
        .layer(Extension(config)),
    ))
    .layer(cors);

  let host = std::env::var("HOST").unwrap_or("127.0.0.1".to_string());
  let port = std::env::var("PORT")
    .ok()
    .and_then(|p| p.parse::<u16>().ok())
    .unwrap_or(8080);
  let addr = format!("{}:{}", host, port);

  info!("serving on {}", addr);

  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
