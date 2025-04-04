use super::super::super::auth::AuthenticatedUser;
use super::super::account::Account;
use super::super::error::WalletError;
use super::super::ledger::Ledger;
use super::super::transaction::Transaction;

use crate::{ commit_tx, tx };

const ACCOUNT_INIT_BALANCE: u32 = 10;

impl Ledger {
    ///
  /// Returns the balance transaction of the given account. If the account
  /// does not have any prior state, will instead initialize their account
  /// with given initial amount.
  ///
  /// ### Params:
  /// - `account`: the account to get the balance of
  /// - `init_amount`: the initial amount to set the account balance to, if it doesn't exist.
  ///                  Provide `None` to fall back on the default value.
  /// - `issuer`: the user who is requesting the balance, or initializing the
  ///             account, if it didn't already exist.
  ///
  /// ### Returns:
  /// The balance transaction, or appropriate error.
  ///
  pub async fn balance_or_init(
    &self,
    account: &Account,
    init_amount: Option<u32>,
    issuer: &AuthenticatedUser,
  ) -> Result<Transaction, WalletError> {
    match self.find_balance(account).await {
      Ok(tx) => Ok(tx),
      Err(_) => {
        match commit_tx! [
          tx! { => account; using init_amount.unwrap_or(ACCOUNT_INIT_BALANCE); by issuer };
          to self
        ] {
          Ok([balance]) => Ok(balance),
          Err(_) => Err(WalletError::Unknown),
        }
      }
    }
  }
}
