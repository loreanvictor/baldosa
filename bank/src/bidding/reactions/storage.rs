use serde::{Deserialize, Serialize};
use sqlx::{postgres::Postgres, types::Uuid, Pool, Type};

use crate::auth::AuthenticatedUser;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Type, Deserialize, Serialize)]
#[sqlx(type_name = "reaction_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ReactionType {
  Like,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReactionSummary {
  pub like_count: i32,
  pub viewer_reaction: Option<ReactionType>,
}

#[derive(Clone)]
pub struct ReactionStore {
  pool: Pool<Postgres>,
}

impl ReactionStore {
  pub fn new(pool: Pool<Postgres>) -> Self {
    Self { pool }
  }

  pub async fn set_reaction(
    &self,
    bid_id: &Uuid,
    reaction: ReactionType,
    user: &AuthenticatedUser,
  ) -> Result<(), sqlx::Error> {
    sqlx::query!(
      "
        with prev as (
          select reaction
          from reactions
          where bid_id = $1 and user_id = $2
        ),
        up as (
          insert into reactions (bid_id, user_id, reaction)
          values ($1, $2, $3)
          on conflict (bid_id, user_id) do update
            set reaction = excluded.reaction,
                updated_at = now()
        ),
        delta as (
          select
            case when (select reaction from prev) = 'like' then 1 else 0 end as prev_like,
            case when $3 = 'like' then 1 else 0 end as new_like
        )
        insert into reaction_summary (bid_id, like_count)
        select
          $1,
          (delta.new_like - delta.prev_like)
        from delta
        on conflict (bid_id) do update
        set like_count = reaction_summary.like_count
                      + (excluded.like_count),
            updated_at = now();
      ",
      bid_id,
      user.id,
      reaction as ReactionType,
    )
    .execute(&self.pool)
    .await?;

    Ok(())
  }

  pub async fn clear_reaction(
    &self,
    bid_id: &Uuid,
    reaction: ReactionType,
    user: &AuthenticatedUser,
  ) -> Result<(), sqlx::Error> {
    sqlx::query!(
      "
        with del as (
          delete from reactions
          where bid_id = $1
            and user_id = $2
            and reaction = $3
          returning 1
        )
        update reaction_summary
        set like_count = like_count - (
              case when $3 = 'like' then (select count(*) from del) else 0 end
            ),
            updated_at = now()
        where bid_id = $1
      ",
      bid_id,
      user.id,
      reaction as ReactionType,
    )
    .execute(&self.pool)
    .await?;
    Ok(())
  }

  pub async fn reactions_summary(
    &self,
    bid_id: &Uuid,
    user: Option<&AuthenticatedUser>,
  ) -> Result<ReactionSummary, sqlx::Error> {
    let rec = sqlx::query!(
      "
        select
          coalesce(rs.like_count, 0) as \"like_count!\",
          r.reaction as \"viewer_reaction: ReactionType\"
        from (select $1::uuid as bid_id) b
        left join reaction_summary rs on rs.bid_id = b.bid_id
        left join reactions r
          on r.bid_id = b.bid_id
          and r.user_id = $2
      ",
      bid_id,
      user.map(|u| u.id),
    )
    .fetch_one(&self.pool)
    .await?;

    Ok(ReactionSummary {
      like_count: rec.like_count,
      viewer_reaction: rec.viewer_reaction,
    })
  }
}
