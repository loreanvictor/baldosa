use log::error;
use serde::Serialize;
use sqlx::types::Uuid;

use super::super::super::auth::AuthenticatedUser;
use super::super::account::Account;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;
use crate::{commit_tx, tx};

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum InjectResult {
  ToUser {
    init: Transaction,
    offer: Transaction,
  },
  ToSysUser {
    init: Transaction,
    offer: Transaction,
    merged: Transaction,
  },
}

impl Ledger {
  ///
  /// Injects given amount of tokens into the receiver's account. The process is done by initializing
  /// a temporary account with the given amount, and then having said temporary account offer the amount
  /// to the receiver. If the receiver is a system account, the offer will be automatically accepted and merged.
  ///
  /// ```
  /// ──▷ :tmp ──▷ tmp:a
  /// ```
  /// or
  /// ```
  /// ──▷ :tmp ──▷ tmp:sys ──┐
  ///                        │
  ///                        ▽
  /// ──▷ sys:sys ══════▷ sys:sys
  /// ```
  ///
  /// ### Params:
  /// - `receiver`: the receiver account
  /// - `amount`: the amount to inject
  /// - `note`: an optional note to attach to the offer
  /// - `issued_by`: the uuid of the user who is injecting the tokens
  ///
  /// ### Returns:
  /// `InjectResult { init, offer, merge }`, where:
  /// - `init` is the initial state of the temporary account created for injection,
  /// - `offer` is an offer from the temporary account to the receiver,
  /// - `merge`, optional, is the new state of the receiver if it is a system account, the offer will be
  ///    automatically accepted and merged in that scenario.
  ///
  pub async fn inject(
    &self,
    receiver: &Account,
    amount: u32,
    note: Option<String>,
    issuer: &AuthenticatedUser,
  ) -> Result<InjectResult, WalletError> {
    let tmp_account = Account::of_sys_user(format!("tmp-{}", Uuid::new_v4()).as_str());

    let [init] = commit_tx! [
      tx! { => &tmp_account; using amount; by issuer };
      to self
    ]
    .map_err(|_| WalletError::Unknown)?;

    let [offer] = commit_tx! [
      tx! { &tmp_account => receiver; using &init, amount; by issuer, note };
      to self
    ]
    .map_err(|_| WalletError::Unknown)?;

    match receiver {
      Account::User(_) => Ok(InjectResult::ToUser { init, offer }),
      Account::System(_) => match self.balance_or_init(receiver, None, issuer).await {
        Ok(balance) => {
          match commit_tx! [
            tx! { merge &offer => balance; by issuer, "asset injection" };
            to self
          ] {
            Ok([merged]) => Ok(InjectResult::ToSysUser {
              init,
              offer,
              merged,
            }),
            Err(err) => {
              error!("Failed to merge offer: {}", err);
              Err(WalletError::Unknown)
            }
          }
        }
        Err(err) => Err(err),
      },
      Account::Invalid => Err(WalletError::UnauthorizedTransaction),
    }
  }
}
