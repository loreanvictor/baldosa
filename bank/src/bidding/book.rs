use chrono::Utc;
use serde_json::to_value;
use sqlx::{postgres::Postgres, Pool};

use super::super::wallet::Transaction;
use super::bid::{Bid, BidContent};

#[derive(Debug, Clone)]
pub struct Book {
  pool: Pool<Postgres>,
}

impl Book {
  pub fn new(pool: Pool<Postgres>) -> Self {
    Self { pool }
  }

  pub async fn record(
    &self,
    tx: &Transaction,
    coords: (i32, i32),
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
      coords.0,
      coords.1,
      to_value(content).unwrap(),
      amount,
      tx.sender
    )
    .fetch_one(&self.pool)
    .await
    .map_err(|e| {
      println!("Failed to create bid: {}", e);
      e
    })
  }

  pub async fn get_earmarked(&self, tx: &Transaction) -> Result<Option<Bid>, sqlx::Error> {
    sqlx::query_as!(
      Bid,
      "
        select * from bids where tx = $1 limit 1
      ",
      tx.id
    )
    .fetch_optional(&self.pool)
    .await
  }

  pub async fn is_tile_vacant(&self, coords: (i32, i32)) -> Result<bool, sqlx::Error> {
    sqlx::query!(
      "select * from published_tiles where x = $1 and y = $2",
      coords.0,
      coords.1
    )
    .fetch_optional(&self.pool)
    .await
    .map(|o| o.is_none() || o.unwrap().occupant_bid.is_none())
  }

  pub async fn mark_as_published(&self, bid: &mut Bid) -> Result<(), sqlx::Error> {
    if bid.published_at.is_some() {
      return Ok(());
    }

    let mut tx = self.pool.begin().await?;

    sqlx::query!("update bids set published_at = now() where id = $1", bid.id)
      .execute(&mut *tx)
      .await?;

    sqlx::query!(
      "
        insert into published_tiles (x, y, occupant_bid) values ($1, $2, $3)
        on conflict (x, y) do update set
          occupant_bid = excluded.occupant_bid,
          last_published_at = now()
      ",
      bid.x,
      bid.y,
      bid.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    bid.published_at = Some(Utc::now());
    Ok(())
  }

  pub async fn mark_as_unpublished(&self, bid: &mut Bid) -> Result<(), sqlx::Error> {
    if bid.published_at.is_none() {
      return Ok(());
    }

    let mut tx = self.pool.begin().await?;

    sqlx::query!("update bids set published_at = null where id = $1", bid.id)
      .execute(&mut *tx)
      .await?;

    sqlx::query!(
      "update published_tiles set occupant_bid = null where occupant_bid = $1",
      bid.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    bid.published_at = None;
    Ok(())
  }
}
