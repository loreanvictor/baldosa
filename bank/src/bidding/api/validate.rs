use super::super::book::{ Book, Coords };
use super::super::config::Config;
use super::super::error::BiddingError;
use super::super::tile::TileAccount;
use crate::auth::AuthenticatedUser;
use crate::wallet::Transaction;

///
/// Checks if given coordinates are ok to bid on.
/// Some coordinates may be blocked for system tiles or other reasons.
///
pub fn validate_coords(coords: Coords, config: &Config) -> Result<(), BiddingError> {
  if config.blocked_coords.iter().any(|&c| c == coords) {
    return Err(BiddingError::UnauthorizedCoords);
  }
  Ok(())
}

///
/// Checks if given user can bid on the given coordinates
/// using given transaction (doesn't check the content).
/// - User must be authenticated
/// - The transaction must be valid, from the user to the correct system account
/// - The coordinates must not be blocked, and must match the receipient of the transaction
/// - The transaction must not be earmarked already for another bid
/// - The transaction must have enough funds to cover the minimum bid for the tile
///
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

  if transaction.total() < config.minimum_bid {
    return Err(BiddingError::InsufficientFunds);
  }

  match book.get_earmarked(transaction).await {
    Ok(Some(_)) => Err(BiddingError::AlreadyEarmarked),
    _ => Ok(()),
  }
}
