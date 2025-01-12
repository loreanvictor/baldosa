use axum::{
  routing::post, Extension, Router
};
use log::info;
use simple_logger::SimpleLogger;

mod auth;
mod config;
mod image;

use image::api::process;


#[tokio::main]
async fn main() {
  SimpleLogger::new().init().unwrap();

  let config = config::init().await;
  info!("starting server");

  let app = auth::protect(
    Router::new()
    .route("/process", post(process))
    .layer(Extension(config))
  );

  let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
