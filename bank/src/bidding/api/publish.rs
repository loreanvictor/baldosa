use axum::{
  extract::{Extension, Json},
  response::IntoResponse,
};
use serde::Deserialize;

use super::super::book::{Bid, Book};
use super::super::error::BiddingError;
use super::super::publisher::Publisher;
use super::admin::BidByIdForAdmin;
use super::auth::OwnedLiveBidByCoords;
use crate::auth::admin::AdminUser;
use crate::commit_tx;
use crate::wallet::{Ledger, Transaction};

pub async fn publish(
  bid: &mut Bid,
  transaction: &Transaction,
  book: &Book,
  publisher: &Publisher,
  ledger: &Ledger,
) -> Result<(), BiddingError> {
  let forward = Transaction {
    consumes: transaction.id,
    consumed_value: i32::try_from(transaction.total()).unwrap_or_default(),
    sender_sys: transaction.receiver_sys.clone(),
    receiver_sys: Some("bank".to_string()),
    issued_by: transaction.issued_by,
    note: Some(format!("bid {} published", bid.id)),
    ..Default::default()
  };

  publisher
    .publish(bid)
    .await
    .map_err(|_| BiddingError::Unknown)?;
  // TODO: this will cause the bid to be retried upon the next auction run.
  //       however, in some cases we should stop retrying and instead reject the
  //       bid due to inherent issues with the bid content. this is basically
  //       based on the error returned by the publisher sdk.
  commit_tx! [forward; to ledger].map_err(|_| BiddingError::Unknown)?;
  book
    .mark_as_published(bid)
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(())
}

pub async fn unpublish(
  Extension(book): Extension<Book>,
  Extension(publisher): Extension<Publisher>,
  OwnedLiveBidByCoords(mut bid, _): OwnedLiveBidByCoords,
) -> Result<impl IntoResponse, BiddingError> {
  book
    .unpublish(&mut bid)
    .await
    .map_err(|_| BiddingError::Unknown)?;
  publisher
    .unpublish(&bid.coords())
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(())
}

#[derive(Deserialize)]
pub struct RejectBody {
  pub reason: String,
}

pub async fn reject(
  Extension(book): Extension<Book>,
  Extension(publisher): Extension<Publisher>,
  BidByIdForAdmin(mut bid, AdminUser(user)): BidByIdForAdmin,
  Json(body): Json<RejectBody>,
) -> Result<impl IntoResponse, BiddingError> {
  if !bid.rejection.is_none() {
    return Err(BiddingError::UnauthorizedBid);
  }

  let coords = bid.coords();
  let occupant_bid = book
    .get_occupant_bid(&coords)
    .await
    .map_err(|_| BiddingError::Unknown)?;

  book
    .reject(&mut bid, &user, &body.reason)
    .await
    .map_err(|_| BiddingError::Unknown)?;

  if let Some(occupant_bid) = occupant_bid {
    if occupant_bid.id == bid.id {
      publisher
        .unpublish(&coords)
        .await
        .map_err(|_| BiddingError::Unknown)?;
    }
  }

  Ok(())
}
