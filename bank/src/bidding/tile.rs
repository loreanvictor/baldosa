use super::book::Coords;
use crate::wallet::{Account, Transaction};

pub struct TileAccount {
  pub x: i32,
  pub y: i32,
}

impl TileAccount {
  pub fn account(&self) -> Account {
    Account::of_sys_user(&String::from(self))
  }

  pub fn is_recipient_of(&self, tx: &Transaction) -> bool {
    match tx.receiver_account() {
      Account::System(sys) => sys == String::from(self),
      _ => false,
    }
  }
}

impl From<&TileAccount> for String {
  fn from(tile_account: &TileAccount) -> Self {
    format!("tile:{}:{}", tile_account.x, tile_account.y)
  }
}

impl From<Coords> for TileAccount {
  fn from(coords: Coords) -> Self {
    Self {
      x: coords.x,
      y: coords.y,
    }
  }
}
