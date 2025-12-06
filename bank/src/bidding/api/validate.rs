use super::super::book::{BidContent, Book, Coords};
use super::super::config::Config;
use super::super::error::BiddingError;
use super::super::tile::TileAccount;
use crate::auth::AuthenticatedUser;
use crate::bidding::error::{BidContentErrorKind, BiddingContentValidationErrors};
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
pub async fn validate_tx(
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
    return Err(BiddingError::IncorrectTransaction);
  }

  if transaction.total() < config.minimum_bid {
    return Err(BiddingError::InsufficientFunds);
  }

  match book.get_earmarked(transaction).await {
    Ok(Some(_)) => Err(BiddingError::AlreadyEarmarked),
    _ => Ok(()),
  }
}

pub const MAX_TITLE_LEN: usize = 100;
pub const MAX_SUBTITLE_LEN: usize = 200;
pub const MAX_LINK_LEN: usize = 500;
pub const MAX_DESCRIPTION_LEN: usize = 900;

pub fn validate_content(content: &BidContent) -> Result<(), BiddingContentValidationErrors> {
  let mut errs = BiddingContentValidationErrors {
    title: None,
    subtitle: None,
    link: None,
    description: None,
  };

  if let Some(t) = &content.title {
    if t.len() > MAX_TITLE_LEN {
      errs.title = Some(BidContentErrorKind::TooLong);
    }
  }

  if let Some(s) = &content.subtitle {
    if s.len() > MAX_SUBTITLE_LEN {
      errs.subtitle = Some(BidContentErrorKind::TooLong);
    }
  }

  if let Some(l) = &content.url {
    if l.len() > MAX_LINK_LEN {
      errs.link = Some(BidContentErrorKind::TooLong);
    } else if url::Url::parse(l).is_err() {
      errs.link = Some(BidContentErrorKind::InvalidUrl);
    }
  }

  if let Some(d) = &content.description {
    if d.len() > MAX_DESCRIPTION_LEN {
      errs.description = Some(BidContentErrorKind::TooLong);
    }
  }

  if errs.is_empty() {
    Ok(())
  } else {
    Err(errs)
  }
}
