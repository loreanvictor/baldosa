use axum::{
  extract::{Extension, Json, Path},
  response::IntoResponse,
};
use serde::Deserialize;

use super::super::book::{Bid, Book, Coords};
use super::super::error::BiddingError;
use super::super::publisher::Publisher;
use super::auth::OwnedLiveBidByCoords;
use crate::wallet::{Ledger, Transaction};
use crate::{auth::admin::AdminUser, commit_tx};

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
  commit_tx! [forward; to ledger].map_err(|_| BiddingError::Unknown)?;

  publisher
    .publish(bid)
    .await
    .map_err(|_| BiddingError::Unknown)?;
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

// TODO: this should also support bid ids for unpublished bids
pub async fn reject(
  Extension(book): Extension<Book>,
  Extension(publisher): Extension<Publisher>,
  AdminUser(user): AdminUser,
  Path(coords): Path<Coords>,
  Json(body): Json<RejectBody>,
) -> Result<impl IntoResponse, BiddingError> {
  let bid = book
    .get_occupant_bid(coords)
    .await
    .map_err(|_| BiddingError::Unknown)?;

  if let Some(mut bid) = bid {
    book
      .reject(&mut bid, &user, &body.reason)
      .await
      .map_err(|_| BiddingError::Unknown)?;
    publisher
      .unpublish(&coords)
      .await
      .map_err(|_| BiddingError::Unknown)?;
  }

  Ok(())
}
