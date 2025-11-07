use serde_json::to_value;
use sqlx::{postgres::Postgres, Pool, types::Uuid};

use super::super::config::Config;
use super::bid::{Bid, BidContent};
use super::coords::Coords;
use crate::wallet::Transaction;
use crate::auth::AuthenticatedUser;

#[derive(Debug, Clone)]
pub struct Book {
  pub pool: Pool<Postgres>,
  pub config: Config,
}

impl Book {
  pub fn new(config: Config, pool: Pool<Postgres>) -> Self {
    Self { pool, config }
  }

  pub async fn record_bid(
    &self,
    tx: &Transaction,
    coords: Coords,
    content: BidContent,
    amount: i32,
  ) -> Result<Bid, sqlx::Error> {
    sqlx::query_as!(
      Bid,
      "
        insert into bids (tx, x, y, content, amount, bidder)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      ",
      tx.id,
      coords.x,
      coords.y,
      to_value(content).unwrap(),
      amount,
      tx.sender
    )
    .fetch_one(&self.pool)
    .await
    .map_err(|e| {
      println!("Failed to create bid: {e}");
      e
    })
  }

  pub async fn get_bid(&self, id: &Uuid) -> Result<Bid, sqlx::Error> {
    sqlx::query_as!(Bid, "select * from bids where id = $1", id)
      .fetch_one(&self.pool)
      .await
  }

  pub async fn rescind_bid(&self, bid: &Bid, user: &AuthenticatedUser) -> Result<(), sqlx::Error> {
    let res = sqlx::query!(
      "
      delete from bids
      where id = $1 and bidder = $2
      and published_at is null and rejection is null",
      bid.id,
      user.id
    )
    .execute(&self.pool)
    .await?;

    if res.rows_affected() == 0 {
      Err(sqlx::Error::RowNotFound)
    } else {
      Ok(())
    }
  }
}
