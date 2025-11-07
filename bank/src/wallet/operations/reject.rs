use super::super::super::auth::AuthenticatedUser;
use super::super::account::Account;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;
use crate::{commit_tx, tx};

impl Ledger {
  ///
  /// Rejects an offer, offering the amount back to the original sender.
  ///
  /// ```
  /// ──▷ a:b ──▷ b:a
  /// ```
  ///
  /// ### Params:
  /// - `offer`: the offer to reject
  /// - `issued_by`: the uuid of the user who is rejecting the offer
  ///
  /// ### Returns:
  /// the reverse transaction.
  ///
  pub async fn reject_offer(
    &self,
    offer: &Transaction,
    note: Option<String>,
    issuer: &AuthenticatedUser,
  ) -> Result<Transaction, WalletError> {
    if offer.consumed || offer.merged {
      return Err(WalletError::AlreadyUsedTransaction);
    }

    let sender = offer.sender_account();
    let receiver = offer.receiver_account();

    match commit_tx! [
      tx! { receiver => sender; using offer, offer.total(); by issuer, note };
      to self
    ] {
      Ok([revert]) => Ok(revert),
      Err(_) => Err(WalletError::Unknown),
    }
  }
}
