use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{types::Uuid, FromRow};

use super::account::Account;

#[derive(Serialize, Deserialize, Debug, FromRow, Clone, Default)]
pub struct Transaction {
  pub id: Option<Uuid>,

  pub sender: Option<Uuid>,
  pub receiver: Option<Uuid>,
  pub sender_sys: Option<String>,
  pub receiver_sys: Option<String>,

  pub consumes: Option<Uuid>,
  pub merges: Option<Uuid>,
  pub consumed_value: i32,
  pub merged_value: i32,

  pub is_state: bool,
  pub consumed: bool,
  pub merged: bool,
  pub note: Option<String>,

  pub created_at: DateTime<Utc>,
  pub issued_by: Uuid,
}

impl Transaction {
  #[inline(always)]
  pub fn total(&self) -> u32 {
    (self.consumed_value + self.merged_value) as u32
  }

  #[inline(always)]
  pub fn sender_account(&self) -> Account {
    Account::from_tuple(&self.sender, &self.sender_sys)
  }

  #[inline(always)]
  pub fn receiver_account(&self) -> Account {
    Account::from_tuple(&self.receiver, &self.receiver_sys)
  }
}
