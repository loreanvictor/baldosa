use serde::Serialize;

use super::super::super::auth::AuthenticatedUser;
use super::super::account::Account;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;

use crate::{ commit_tx, tx };

#[derive(Serialize)]
pub struct OfferResult {
  pub offer: Transaction,
  pub rest: Transaction,
}

impl Ledger {
    ///
  /// Offers the given amount from a sender account to a receiver account. Will also
  /// create a new state for the sender, based on the remainder of their balance.
  /// ```
  /// ──▷ a:a ─┬──▷ a:a
  ///          │
  ///          │
  ///          └──▷ a:b
  /// ```
  /// ### Params:
  /// - `sender`: the sender account
  /// - `receiver`: the receiver account
  /// - `amount`: the amount to offer
  /// - `note`: an optional note to attach to the offer
  /// - `issuer`: the user who is requesting the offer
  ///
  /// ### Returns:
  /// `OfferResult(offered, rest)`, where:
  /// - `offered` is an offer of the requested amount,
  /// - `rest` is the new state of the sender.
  ///
  pub async fn offer_from_balance(
    &self,
    sender: &Account,
    receiver: &Account,
    amount: u32,
    note: Option<String>,
    issuer: &AuthenticatedUser,
  ) -> Result<OfferResult, WalletError> {
    match self.balance_or_init(sender, None, issuer).await {
      Ok(balance) => {
        let total = balance.total();
        if total < amount {
          return Err(WalletError::InsufficientFunds);
        }

        match commit_tx! [
          tx! { sender => receiver; using &balance, amount; by issuer, note },
          tx! { sender => sender; using &balance, total - amount; by issuer };
          to self
        ] {
          Ok([offer, rest]) => Ok(OfferResult { offer, rest }),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }
}
