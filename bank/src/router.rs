use axum::{extract::Extension, Router};
use log::info;
use sqlx::{postgres::Postgres, Pool};

use super::auth;
use super::bidding;
use super::config::Config;
use super::wallet;

pub async fn start_server(config: &Config, db: &Pool<Postgres>) {
  info!("Starting server");

  let admin = auth::admin::AdminConfig::init();
  let ledger = wallet::Ledger::new(config.wallet.clone(), db.clone());

  let app = Router::new()
    .nest("/auth", auth::router(db))
    .nest("/wallet", wallet::router(&ledger))
    .nest(
      "/bids",
      bidding::router(config.bidding.clone(), &ledger, db),
    )
    .layer(Extension(admin));

  let host = std::env::var("HOST").unwrap_or("127.0.0.1".to_string());
  let port = std::env::var("PORT")
    .ok()
    .and_then(|p| p.parse::<u16>().ok())
    .unwrap_or(8081);

  let addr = format!("{host}:{port}");

  info!("serving on {addr}");

  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  axum::serve(listener, app).await.unwrap();
}
