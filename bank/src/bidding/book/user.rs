use anyhow::{anyhow, Context};
use sqlx::types::{
  chrono::{DateTime, Utc},
  JsonValue, Uuid,
};

use super::bid::{Bid, BidContent, PendingBid};
use super::core::Book;
use crate::auth::AuthenticatedUser;

impl Book {
  pub async fn get_user_published_bids(
    &self,
    user: &AuthenticatedUser,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<Bid>, anyhow::Error> {
    sqlx::query_as!(
      Bid,
      "
        select bids.* from published_tiles
        join bids on published_tiles.occupant_bid = bids.id
        where bids.bidder = $1
        order by bids.created_at desc
        limit $2 offset $3
      ",
      user.id,
      i64::from(limit),
      i64::from(offset)
    )
    .fetch_all(&self.pool)
    .await
    .context("Failed to fetch published bids for user")
  }

  pub async fn get_user_pending_bids(
    &self,
    user: &AuthenticatedUser,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<PendingBid>, anyhow::Error> {
    let rows = sqlx::query!(
      r#"
        select
          bids.id, bids.x, bids.y, bids.amount, bids.tx, bids.created_at, bids.content, bids.bidder,
          ocb.id as "o_id?: Uuid", ocb.amount as "o_amount?: i32", ocb.created_at as "o_created_at?: DateTime<Utc>",
          ocb.content as "o_content?: JsonValue", ocb.published_at as "o_published_at?: DateTime<Utc>",
          ocb.bidder as "o_bidder?: Uuid" from bids
        left join published_tiles on bids.x = published_tiles.x and bids.y = published_tiles.y
        left join bids ocb on published_tiles.occupant_bid = ocb.id
        where bids.bidder = $1 and bids.published_at is null and bids.rejection is null
        order by bids.created_at desc
        limit $2 offset $3
      "#,
      user.id,
      i64::from(limit),
      i64::from(offset)
    )
    .fetch_all(&self.pool)
    .await
    .context("Failed to fetch user pending bids.")?;

    Ok(
      rows
        .iter()
        .map(|row| -> Result<PendingBid, anyhow::Error> {
          let occupant =
            row
              .o_id
              .map(|id| -> Result<Bid, anyhow::Error> {
                Ok(Bid {
                  id,
                  x: row.x,
                  y: row.y,
                  bidder: row
                    .o_bidder
                    .ok_or_else(|| anyhow!("missing occupant bidder when fetching pending bid"))?,
                  amount: row
                    .o_amount
                    .ok_or_else(|| anyhow!("missing occupant amount when fetching pending bid"))?,
                  tx: row.tx,
                  created_at: row.o_created_at.ok_or_else(|| {
                    anyhow!("missing occupant created_at when fetching pending bid")
                  })?,
                  content: BidContent::from(row.o_content.clone().ok_or_else(|| {
                    anyhow!("missing occupant content when fetching pending bid")
                  })?),
                  published_at: row.o_published_at,
                  rejection: None,
                })
              })
              .transpose()?;

          Ok(PendingBid {
            bid: Bid {
              id: row.id,
              x: row.x,
              y: row.y,
              bidder: row.bidder,
              amount: row.amount,
              tx: row.tx,
              created_at: row.created_at,
              content: BidContent::from(row.content.clone()),
              published_at: None,
              rejection: None,
            },
            occupant,
            next_auction: None,
          })
        })
        .collect::<Result<Vec<_>, _>>()?,
    )
  }

  pub async fn get_all_user_bids(
    &self,
    user: &AuthenticatedUser,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<Bid>, anyhow::Error> {
    sqlx::query_as!(
      Bid,
      "select * from bids where bidder = $1 order by created_at desc limit $2 offset $3",
      user.id,
      i64::from(limit),
      i64::from(offset)
    )
    .fetch_all(&self.pool)
    .await
    .context("Failed to fetch all bids for user")
  }
}
