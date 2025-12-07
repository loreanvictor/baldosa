use futures::{Stream, TryStreamExt};
use sqlx::postgres::types::PgInterval as Interval;

use super::bid::{Bid, WinningBid};
use super::coords::Coords;
use super::core::Book;
use crate::wallet::Transaction;

impl Book {
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

  pub async fn get_occupant_bid(&self, coords: &Coords) -> Result<Option<Bid>, sqlx::Error> {
    sqlx::query_as!(
      Bid,
      "
        select bids.* from published_tiles
        join bids on published_tiles.occupant_bid = bids.id
        where published_tiles.x = $1 and published_tiles.y = $2
      ",
      coords.x,
      coords.y
    )
    .fetch_optional(&self.pool)
    .await
  }

  pub async fn should_publish_immediately(&self, bid: &Bid) -> Result<bool, sqlx::Error> {
    let guaranteed_occupancy: Interval =
      Interval::try_from(self.config.guaranteed_occupancy).unwrap();
    let publish_now: Option<bool> = sqlx::query_scalar!(
      "
        with
          last_pub as materialized (
            select last_published_at from published_tiles
            where x = $2 and y = $3 and occupant_bid is not null
            limit 1
          ),
          competing as materialized (
            select 1 from bids bid join transactions tx on bid.tx = tx.id
            where bid.id <> $1 and bid.x = $2 and bid.y = $3
              and bid.published_at is null and bid.rejection is null
              and tx.consumed is false
            limit 1
          )
        select
          not exists (select 1 from bids bid where bid.id <> $1 and x = $2 and y = $3)
          or (
            (
              exists (select 1 from last_pub where last_published_at <= now() - $4::interval)
              or not exists (select 1 from last_pub)
            )
            and not exists (select 1 from competing)
          )
        as publish_now
      ",
      bid.id,
      bid.x,
      bid.y,
      guaranteed_occupancy,
    )
    .fetch_one(&self.pool)
    .await?;

    Ok(publish_now.unwrap_or(false))
  }

  pub fn stream_auction_winners(
    &self,
  ) -> impl Stream<Item = Result<WinningBid, sqlx::Error>> + use<'_> {
    // TODO: this might be a bit too much abstract.
    //       the necessary transaction data for updating the ledger already
    //       exists in the bid itself and there is no need for retrieving the
    //       extra data for the transaction really. the optimisation of course would
    //       tightly couple this query and method to how the ledger operates, which
    //       has its own downsides.

    let guaranteed_occupancy: Interval =
      Interval::try_from(self.config.guaranteed_occupancy).unwrap();
    sqlx::query!(
      "
        with auctions as materialized (
          select distinct bid.x, bid.y from bids bid
          join transactions tx on tx.id = bid.tx
            and tx.consumed = false
            and tx.merged = false
          where
            bid.published_at is null
            and bid.rejection is null
            and not exists (
              select 1 from published_tiles tile
              where tile.x = bid.x and tile.y = bid.y
                and tile.occupant_bid is not null
                and tile.last_published_at > now() - $1::interval
            )
        )
        select distinct on (bid.x, bid.y)
          bid.id, bid.bidder, bid.tx, bid.x, bid.y, bid.content, bid.amount,
          bid.created_at, bid.published_at, bid.rejection,
          tx.receiver_sys, tx.consumes as tx_consumes, tx.created_at as tx_created_at,
          tx.note as tx_note
        from auctions auction
        join bids bid on bid.x = auction.x and bid.y = auction.y
        join transactions tx on tx.id = bid.tx
          and tx.consumed = false
          and tx.merged = false
        where bid.published_at is null
          and bid.rejection is null
        order by bid.x, bid.y, bid.amount desc
      ",
      guaranteed_occupancy,
    )
    .fetch(&self.pool)
    .map_ok(|row| WinningBid {
      bid: Bid {
        id: row.id,
        bidder: row.bidder,
        tx: row.tx,
        x: row.x,
        y: row.y,
        content: super::bid::BidContent::from(row.content),
        amount: row.amount,
        created_at: row.created_at,
        published_at: row.published_at,
        rejection: row.rejection,
      },
      transaction: Transaction {
        id: Some(row.tx),
        created_at: row.tx_created_at,
        consumed_value: row.amount,
        consumes: row.tx_consumes,
        sender: Some(row.bidder),
        sender_sys: None,
        receiver: None,
        receiver_sys: row.receiver_sys,
        issued_by: row.bidder,
        merges: None,
        merged_value: 0,
        is_state: false,
        note: row.tx_note,
        consumed: false,
        merged: false,
      },
    })
  }

  #[allow(dead_code)]
  pub async fn get_auction_winners(&self) -> Result<Vec<WinningBid>, sqlx::Error> {
    self.stream_auction_winners().try_collect().await
  }
}
