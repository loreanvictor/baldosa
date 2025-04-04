use super::super::super::auth::AuthenticatedUser;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;

use crate::{ commit_tx, tx };

impl Ledger {
    ///
  /// Rescinds a given offer, merging it back into the sender's prior state,
  /// ```
  /// ──▷ a:a ══▷ a:a
  ///              △
  ///              │
  /// ──▷ a:b ─────┘
  /// ```
  ///
  /// ### Params:
  /// - `offer`: the offer to rescind
  /// - `issued_by`: the uuid of the user who is rescinding the offer
  ///
  /// ### Returns:
  /// the new state of the sender, resulting from merging the offer back into their prior state.
  ///
  pub async fn rescind_offer(
    &self,
    offer: &Transaction,
    issuer: &AuthenticatedUser,
  ) -> Result<Transaction, WalletError> {
    if offer.consumed || offer.merged {
      return Err(WalletError::AlreadyUsedTransaction);
    }

    match self
      .balance_or_init(&offer.sender_account(), None, issuer)
      .await
    {
      Ok(sender_balance) => {
        match commit_tx! [
          tx! { merge offer => sender_balance; by issuer, "offer rescinded" };
          to self
        ] {
          Ok([merged]) => Ok(merged),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }
}
