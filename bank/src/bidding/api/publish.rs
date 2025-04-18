use super::super::bid::Bid;
use super::super::book::Book;
use super::super::error::BiddingError;
use super::super::publisher::Publisher;
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
  commit_tx! [forward; to ledger].map_err(|_| BiddingError::Unknown)?;

  book
    .mark_as_published(bid)
    .await
    .map_err(|_| BiddingError::Unknown)?;
  publisher
    .publish(bid)
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(())
}
