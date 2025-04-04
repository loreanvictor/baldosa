use serde::Serialize;

use super::super::super::auth::AuthenticatedUser;
use super::super::account::Account;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;

use crate::{ commit_tx, tx };

#[derive(Serialize)]
pub struct PartialAcceptResult{
  pub returned: Transaction,
  pub merged: Transaction,
}


impl Ledger {
    ///
  /// Partially accepts an offer, merging given amount of it
  /// into receiver's prior state, and offering the remainder
  /// back to the original sender.
  ///
  /// ```
  /// ──▷ a:b ─────┬────▷ b:a
  ///              │
  ///              ▽
  /// ──▷ b:b ══▷ b:b
  /// ```
  ///
  /// ### Params:
  /// - `offer`: the offer to partially accept
  /// - `amount`: the amount to accept
  /// - `issued_by`: the uuid of the user who is partially accepting the offer
  ///  
  /// ### Returns:
  /// `PartialAcceptResult(returned, merged)`, where:
  /// - `returned` is an offer of the remainder back to the sender
  /// - `merged` is the new state of the receiver, resulting from merging the offer into their prior state.
  ///
  pub async fn partially_accept_offer(
    &self,
    offer: &Transaction,
    amount: u32,
    note: Option<String>,
    issuer: &AuthenticatedUser,
  ) -> Result<PartialAcceptResult, WalletError> {
    if offer.consumed || offer.merged {
      return Err(WalletError::AlreadyUsedTransaction);
    }

    let offered = offer.total();
    let accepted = u32::min(amount, offered);

    let receiver = offer.receiver_account();
    let sender = offer.sender_account();

    match self.balance_or_init(&receiver, None, issuer).await {
      Ok(balance) => {
        match commit_tx! [
          tx! { receiver => sender; using offer, offered - accepted; by issuer, note },
          tx! { merge offer => balance; using accepted; by issuer, "offer accepted" };
          to self
        ] {
          Ok([returned, merged]) => Ok(PartialAcceptResult { returned, merged }),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }
}
