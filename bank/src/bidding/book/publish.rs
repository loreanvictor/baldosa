use chrono::Utc;
use serde_json::to_value;

use crate::auth::AuthenticatedUser;
use super::core::Book;
use super::bid::Bid;

impl Book {
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

  pub async fn unpublish(&self, bid: &mut Bid) -> Result<(), sqlx::Error> {
    let res = sqlx::query!(
      "
        update published_tiles
        set occupant_bid = null
        where x = $1 and y = $2 and occupant_bid = $3
      ",
      bid.x,
      bid.y,
      bid.id
    )
    .execute(&self.pool)
    .await?;
    if res.rows_affected() == 0 {
      Err(sqlx::Error::RowNotFound)
    } else {
      Ok(())
    }
  }

  pub async fn reject(&self, bid: &mut Bid, user: &AuthenticatedUser, reason: &str) -> Result<(), sqlx::Error> {
    if bid.rejection.is_some() {
      return Ok(());
    }

    let mut tx = self.pool.begin().await?;
    // TODO: this should be typed properly
    let rejection = serde_json::json!({
      "reason": reason,
      "rejected_by": user.id.to_string(),
      "rejected_at": Utc::now().to_rfc3339(),
    });

    sqlx::query!(
      "update bids set rejection = $1 where id = $2",
      to_value(rejection).unwrap(),
      bid.id
    ).execute(&mut *tx)
    .await?;

    sqlx::query!(
      "
        update published_tiles
        set occupant_bid = null
        where x = $1 and y = $2 and occupant_bid = $3
      ",
      bid.x,
      bid.y,
      bid.id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
  }
}
