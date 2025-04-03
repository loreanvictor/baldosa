use std::fmt::Display;

use sqlx::types::Uuid;

#[derive(Debug)]

pub enum Account {
  User(Uuid),
  System(String),
  Invalid,
}

impl Account {
  pub fn of_user(user_id: &Uuid) -> Self {
    Account::User(user_id.clone())
  }

  pub fn of_sys_user(sys: &str) -> Self {
    Account::System(sys.to_string())
  }

  pub fn from_tuple(user_id: &Option<Uuid>, sys: &Option<String>) -> Self {
    match (user_id, sys) {
      (Some(id), _) => Account::User(id.clone()),
      (_, Some(sys)) => Account::System(sys.clone()),
      _ => Account::Invalid,
    }
  }
}

impl Display for Account {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Account::User(user_id) => write!(f, "User::{}", user_id),
      Account::System(sys) => write!(f, "Sys::{}", sys),
      Account::Invalid => write!(f, "invalid"),
    }
  }
}
