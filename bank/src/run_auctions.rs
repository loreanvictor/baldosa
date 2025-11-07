use log::info;
use sqlx::{postgres::Postgres, Pool};
use std::time::Instant;

use super::bidding::auctions::publish_all_winning_bids;
use super::config::Config;
use super::wallet::Ledger;

pub async fn run_auctions(config: &Config, db: &Pool<Postgres>) {
  info!("Running auctions...");

  let start = Instant::now();

  let ledger = Ledger::new(config.wallet.clone(), db.clone());
  let result = publish_all_winning_bids(&config.bidding, &ledger, db)
    .await
    .unwrap();

  info!(
    "Published {} bids, {} failed. ({:.2?})",
    result.published.len(),
    result.failed.len(),
    start.elapsed()
  );
}
