use super::super::super::auth::AuthenticatedUser;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;

use crate::{ commit_tx, tx };

impl Ledger {
    ///
  /// Accepts a given offer, merging it into the receiver's prior state,
  /// hence updating their balance.
  ///
  ///```
  /// ──▷ a:b ─────┐
  ///              │
  ///              ▽
  /// ──▷ b:b ══▷ b:b
  /// ```
  ///
  /// ### Params:
  /// - `offer`: the offer to accept
  /// - `issuer`:  the user who is accepting the offer
  ///
  /// ### Returns:
  /// the new state of the receiver, resulting from merging the offer into their prior state.
  ///
  pub async fn accept_offer(
    &self,
    offer: &Transaction,
    issuer: &AuthenticatedUser,
  ) -> Result<Transaction, WalletError> {
    if offer.consumed || offer.merged {
      return Err(WalletError::AlreadyUsedTransaction);
    }

    match self
      .balance_or_init(&offer.receiver_account(), None, issuer)
      .await
    {
      Ok(balance) => {
        match commit_tx! [
          tx! { merge offer => balance; by issuer, "offer accepted" };
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
