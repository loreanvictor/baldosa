use axum::{extract::Extension, Router};
use log::info;
use sqlx::{postgres::Postgres, Pool};

use super::auth;
use super::bidding;
use super::wallet;

pub async fn start_server(db: &Pool<Postgres>) {
  info!("Starting server");

  let admin = auth::admin::AdminConfig::init();

  let app = Router::new()
    .nest("/auth", auth::router(db))
    .nest("/wallet", wallet::router(db))
    .nest("/bids", bidding::router(db))
    .layer(Extension(admin));

  let host = std::env::var("HOST").unwrap_or("127.0.0.1".to_string());
  let port = std::env::var("PORT")
    .ok()
    .and_then(|p| p.parse::<u16>().ok())
    .unwrap_or(8081);

  let addr = format!("{}:{}", host, port);

  info!("serving on {}", addr);

  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
