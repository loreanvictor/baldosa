use super::super::book::Book;
use super::super::config::Config;
use super::super::coords::Coords;
use super::super::error::BiddingError;
use super::super::tile_account::TileAccount;
use crate::auth::AuthenticatedUser;
use crate::wallet::Transaction;

pub fn validate_coords(coords: Coords, config: &Config) -> Result<(), BiddingError> {
  if config.blocked_coords.iter().any(|&c| c == coords) {
    return Err(BiddingError::UnauthorizedCoords);
  }
  Ok(())
}

pub async fn validate_bid(
  book: &Book,
  transaction: &Transaction,
  bidder: &AuthenticatedUser,
  coords: Coords,
  config: &Config,
) -> Result<(), BiddingError> {
  validate_coords(coords, config)?;

  if !transaction.is_usable_offer_from(&bidder.id) {
    return Err(BiddingError::UnauthorizedTransaction);
  }

  if !TileAccount::from(coords).is_recipient_of(transaction) {
    return Err(BiddingError::InvalidBid);
  }

  if transaction.total() < 1 {
    return Err(BiddingError::InsufficientFunds);
  }

  match book.get_earmarked(transaction).await {
    Ok(Some(_)) => Err(BiddingError::AlreadyEarmarked),
    _ => Ok(()),
  }
}
