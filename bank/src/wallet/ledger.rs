use sqlx::{postgres::Postgres, types::Uuid, FromRow, Pool, QueryBuilder};

use super::account::Account;
use super::config::Config;
use super::transaction::Transaction;

#[derive(Debug, Clone)]
pub struct Ledger {
  pool: Pool<Postgres>,
  pub config: Config,
}

impl Ledger {
  pub fn new(config: Config, pool: Pool<Postgres>) -> Self {
    Self { pool, config }
  }

  pub async fn get_transaction(&self, id: &Uuid) -> Result<Transaction, sqlx::Error> {
    match sqlx::query_as!(
      Transaction,
      "
        select * from transactions where id = $1
      ",
      id
    )
    .fetch_one(&self.pool)
    .await
    {
      Ok(tx) => Ok(tx),
      Err(e) => Err(e),
    }
  }

  pub async fn find_balance(&self, account: &Account) -> Result<Transaction, sqlx::Error> {
    let result = match account {
      Account::User(user_id) => {
        sqlx::query_as!(
          Transaction,
          "
            select * from transactions
            where receiver = $1
              and is_state = true
              and consumed is false and merged is false
          ",
          user_id
        )
        .fetch_one(&self.pool)
        .await
      }
      Account::System(sys_id) => {
        sqlx::query_as!(
          Transaction,
          "
            select * from transactions
            where receiver_sys = $1
              and is_state = true
              and consumed is false and merged is false
          ",
          sys_id
        )
        .fetch_one(&self.pool)
        .await
      }
      Account::Invalid => return Err(sqlx::Error::RowNotFound),
    };

    match result {
      Ok(tx) => Ok(tx),
      Err(e) => Err(e),
    }
  }

  pub async fn find_open_offers(
    &self,
    account: &Account,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<Transaction>, sqlx::Error> {
    let result = match account {
      Account::User(user_id) => {
        sqlx::query_as!(
          Transaction,
          "
            select * from transactions
            where receiver = $1
              and consumed is false and merged is false
            offset $2
            limit $3
          ",
          user_id,
          i64::from(offset),
          i64::from(limit),
        )
        .fetch_all(&self.pool)
        .await
      }
      Account::System(sys_id) => {
        sqlx::query_as!(
          Transaction,
          "
            select * from transactions
            where receiver_sys = $1
              and consumed is false and merged is false
            offset $2
            limit $3
          ",
          sys_id,
          i64::from(offset),
          i64::from(limit),
        )
        .fetch_all(&self.pool)
        .await
      }
      Account::Invalid => return Err(sqlx::Error::RowNotFound),
    };

    match result {
      Ok(txs) => Ok(txs),
      Err(e) => Err(e),
    }
  }

  pub async fn transaction_history(
    &self,
    user_id: &Uuid,
    offset: u32,
    limit: u32,
  ) -> Result<Vec<Transaction>, sqlx::Error> {
    match sqlx::query_as!(
      Transaction,
      "
        select * from transactions
        where sender = $1 or receiver = $1
        order by created_at desc
        offset $2
        limit $3
      ",
      user_id,
      i64::from(offset),
      i64::from(limit),
    )
    .fetch_all(&self.pool)
    .await
    {
      Ok(txs) => Ok(txs),
      Err(e) => Err(e),
    }
  }

  pub async fn store<const N: usize>(
    &self,
    txs: [Transaction; N],
  ) -> Result<[Transaction; N], sqlx::Error> {
    let mut query = QueryBuilder::new(
      "insert into transactions (
        sender, sender_sys, receiver, receiver_sys,
        consumes, consumed_value, merges, merged_value,
        note, issued_by
      )",
    );

    query.push_values(&txs, |mut b, tx| {
      b.push_bind(tx.sender);
      b.push_bind(tx.sender_sys.clone());
      b.push_bind(tx.receiver);
      b.push_bind(tx.receiver_sys.clone());
      b.push_bind(tx.consumes);
      b.push_bind(tx.consumed_value);
      b.push_bind(tx.merges);
      b.push_bind(tx.merged_value);
      b.push_bind(tx.note.clone());
      b.push_bind(tx.issued_by);
    });

    query.push("returning *");

    match query.build().fetch_all(&self.pool).await {
      Ok(rows) => Ok(
        rows
          .iter()
          .map(|row| Transaction::from_row(row).unwrap())
          .collect::<Vec<Transaction>>()
          .try_into()
          .unwrap(),
      ),
      Err(e) => Err(e),
    }
  }
}
