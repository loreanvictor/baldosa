use axum::{
  routing::post, Extension, Router
};
use log::info;
use env_logger;

mod auth;
mod config;
mod s3;
mod image;

use image::api::publish_handler;


#[tokio::main]
async fn main() {
  dotenv::dotenv().ok();
  env_logger::init();

  let config = config::init().await;
  let s3 = s3::init().await;

  info!("starting server");

  let app = auth::protect(
    Router::new()
      .route("/publish", post(publish_handler))
      .layer(Extension(config))
      .layer(Extension(s3))
  );

  let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
