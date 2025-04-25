use std::fmt::Display;

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
  #[allow(clippy::cast_sign_loss)]
  #[allow(clippy::inline_always)]
  #[inline(always)]
  pub fn total(&self) -> u32 {
    (self.consumed_value + self.merged_value) as u32
  }

  #[allow(clippy::inline_always)]
  #[inline(always)]
  pub fn sender_account(&self) -> Account {
    Account::from_tuple(self.sender.as_ref(), self.sender_sys.as_ref())
  }

  #[allow(clippy::inline_always)]
  #[inline(always)]
  pub fn receiver_account(&self) -> Account {
    Account::from_tuple(self.receiver.as_ref(), self.receiver_sys.as_ref())
  }

  pub fn is_used(&self) -> bool {
    self.consumed || self.merged
  }

  pub fn is_offer(&self) -> bool {
    !self.is_state
  }

  pub fn is_usable_by_user(&self, user_id: &Uuid) -> bool {
    !self.is_used() && (self.sender == Some(*user_id) || self.receiver == Some(*user_id))
  }

  pub fn is_usable_offer_to(&self, user_id: &Uuid) -> bool {
    self.is_usable_by_user(user_id) && self.is_offer() && self.receiver == Some(*user_id)
  }

  pub fn is_usable_offer_from(&self, user_id: &Uuid) -> bool {
    self.is_usable_by_user(user_id) && self.is_offer() && self.sender == Some(*user_id)
  }
}

impl Display for Transaction {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      f,
      "{} -({})-> {}:{} <=({})= {}",
      self.consumes.map_or(" ".into(), |id| id.to_string()),
      self.consumed_value,
      self.sender_account(),
      self.receiver_account(),
      self.merged_value,
      self.merges.map_or(" ".into(), |id| id.to_string()),
    )
  }
}
