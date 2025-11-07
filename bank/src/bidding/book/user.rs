use sqlx::types::Uuid;

use super::bid::{ Bid, BidContent, PendingBid };
use super::core::Book;
use crate::auth::AuthenticatedUser;

impl Book {
  pub async fn get_user_published_bids(
    &self,
    user: &AuthenticatedUser,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<Bid>, sqlx::Error> {
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
  }

  pub async fn get_user_pending_bids(
    &self,
    user: &AuthenticatedUser,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<PendingBid>, sqlx::Error> {
    let rows = sqlx::query!(
      r#"
        select
          bids.id, bids.x, bids.y, bids.amount, bids.tx, bids.created_at, bids.content, bids.bidder,
          ocb.id as "o_id? : Uuid", ocb.amount as o_amount, ocb.created_at as o_created_at, ocb.content as o_content, ocb.published_at as o_published_at, ocb.bidder as o_bidder from bids
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
    .await?;

    Ok(rows.iter().map(|row| PendingBid {
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
        rejection: None
      },
      occupant: row.o_id.map(|id| Bid {
        id,
        x: row.x,
        y: row.y,
        bidder: row.o_bidder,
        amount: row.o_amount,
        tx: row.tx,
        created_at: row.o_created_at,
        content: BidContent::from(row.o_content.clone()),
        published_at: row.o_published_at,
        rejection: None
      }),
      next_auction: None,
    }).collect())
  }

  pub async fn get_all_user_bids(
    &self,
    user: &AuthenticatedUser,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<Bid>, sqlx::Error> {
    sqlx::query_as!(
      Bid,
      "select * from bids where bidder = $1 order by created_at desc limit $2 offset $3",
      user.id,
      i64::from(limit),
      i64::from(offset)
    )
    .fetch_all(&self.pool)
    .await
  }
}
