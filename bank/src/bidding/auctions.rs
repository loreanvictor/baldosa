use futures::TryStreamExt;
use log::{error, info};
use sqlx::{postgres::Postgres, Pool};

use super::api::publish;
use super::book::{Bid, Book};
use super::config::Config;
use super::error::BiddingError;
use super::publisher::Publisher;
use crate::wallet::Ledger;

pub struct PublishAllResult {
  pub published: Vec<Bid>,
  pub failed: Vec<Bid>,
}

pub async fn publish_all_winning_bids(
  config: &Config,
  ledger: &Ledger,
  db: &Pool<Postgres>,
) -> Result<PublishAllResult, BiddingError> {
  let book = Book::new(config.clone(), db.clone());
  let publisher = Publisher::from_env();

  let mut bids = book.stream_auction_winners();
  let mut published = vec![];
  let mut failed = vec![];

  // TODO: right now we operate with one publisher, so it makes
  //       sense to publish one by one. In the future, we should
  //       split this stream into shards that go to different publishers,
  //       and publish from each shard in parallel.
  while let Some(mut winning) = bids.try_next().await.map_err(|_| BiddingError::Unknown)? {
    info!("Publishing {} <- {}", winning.bid.coords(), winning.bid.id);
    match publish(
      &mut winning.bid,
      &winning.transaction,
      &book,
      &publisher,
      ledger,
    )
    .await
    {
      Ok(()) => {
        info!(
          "✅ Published {} <- {}",
          winning.bid.coords(),
          winning.bid.id
        );
        published.push(winning.bid);
      }
      Err(error) => {
        error!(
          "❌ Failed publishing {} <- {}: {:?}",
          winning.bid.coords(),
          winning.bid.id,
          error
        );
        failed.push(winning.bid);
      }
    }
  }

  Ok(PublishAllResult { published, failed })
}
