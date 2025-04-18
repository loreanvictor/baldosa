use super::super::book::Book;
use super::super::error::BiddingError;
use super::super::tile_account::TileAccount;
use crate::auth::AuthenticatedUser;
use crate::wallet::Transaction;

pub async fn validate_bid(
  book: &Book,
  transaction: &Transaction,
  bidder: &AuthenticatedUser,
  coords: (i32, i32),
) -> Result<(), BiddingError> {
  // TODO: check if the coordinates are one of the "system" tiles
  //       which should be untouchable by users.

  if !transaction.is_usable_offer_from(&bidder.id) {
    return Err(BiddingError::UnauthorizedTransaction);
  }

  if !TileAccount::from(coords).is_recipient_of(transaction) {
    return Err(BiddingError::InvalidBid);
  }

  if transaction.total() < 1 {
    return Err(BiddingError::InsufficientFunds);
  }

  match book.get_earmarked(&transaction).await {
    Ok(Some(_)) => return Err(BiddingError::AlreadyEarmarked),
    _ => Ok(()),
  }
}
