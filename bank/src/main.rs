mod env;
mod router;
mod auth;
mod db;
mod run_auctions;

#[tokio::main]
async fn main() {
  env::init().unwrap();
  let db = db::init().await;

  let mode = std::env::args().nth(1);

  if mode == Some("auctions".to_string()) {
    run_auctions::run_auctions().await;
  } else {
    router::start_server(&db).await;
  }
}
