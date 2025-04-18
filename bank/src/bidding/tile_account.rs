use super::util::{parse_coords, ParseCoordsError};
use crate::wallet::{Account, Transaction};

pub struct TileAccount(pub i32, pub i32);

impl TileAccount {
  pub fn from(coords: (i32, i32)) -> Self {
    Self(coords.0, coords.1)
  }

  pub fn coords(&self) -> (i32, i32) {
    (self.0, self.1)
  }

  pub fn to_string(&self) -> String {
    format!("tile:{}:{}", self.0, self.1)
  }

  pub fn account(&self) -> Account {
    Account::of_sys_user(&self.to_string())
  }

  pub fn parse(s: &str) -> Result<Self, ParseCoordsError> {
    match s.split_once(':') {
      Some((pref, coords)) if pref == "tile" => parse_coords(coords).map(TileAccount::from),
      _ => Err(ParseCoordsError::InvalidFormat),
    }
  }

  pub fn is_recipient_of(&self, tx: &Transaction) -> bool {
    match tx.receiver_account() {
      Account::System(sys) => sys == self.to_string(),
      _ => false,
    }
  }
}
