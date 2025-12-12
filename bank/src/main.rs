#![warn(clippy::pedantic)]

mod config;
mod db;
mod env;
mod router;

mod auth;
mod bidding;
mod health;
mod run_auctions;
mod wallet;

#[tokio::main]
async fn main() {
  env::init().unwrap();

  let conf = config::init().unwrap_or_else(|e| {
    log::error!("Failed to load config: {e}");
    std::process::exit(1);
  });

  let db = db::init().await;

  let mode = std::env::args().nth(1);

  if mode == Some("auctions".to_string()) {
    run_auctions::run_auctions(&conf, &db).await;
  } else {
    router::start_server(&conf, &db).await;
  }
}
