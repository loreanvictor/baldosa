use sqlx::types::Uuid;

use super::super::auth::AuthenticatedUser;
use super::account::Account;
use super::error::WalletError;
use super::ledger::Ledger;
use super::transaction::Transaction;
use crate::{commit_tx, tx};

const ACCOUNT_INIT_BALANCE: u32 = 10;

pub struct OfferResult(pub Transaction, pub Transaction);
pub struct PartialAcceptResult(pub Transaction, pub Transaction);
pub enum InjectResult {
  ToUser(Transaction, Transaction),
  ToSysUser(Transaction, Transaction, Transaction),
}

///
/// Some operations on the offer-based chain-of-state ledger.
/// For more information on OCSL, and the graph notation
/// of the operations, see [this](https://gist.github.com/loreanvictor/3425d6d52228bc3dd953b2d636d50f86)
///
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
          Err(err) => Err(WalletError::Unknown),
        }
      }
    }
  }

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
          Ok([offer, rest]) => Ok(OfferResult(offer, rest)),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }

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
          tx! { merge offer => balance; by issuer };
          to self
        ] {
          Ok([merged]) => Ok(merged),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }

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
          tx! { merge offer => sender_balance; by issuer };
          to self
        ] {
          Ok([merged]) => Ok(merged),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }

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
          tx! { merge offer => balance; using accepted; by issuer };
          to self
        ] {
          Ok([returned, merged]) => Ok(PartialAcceptResult(returned, merged)),
          Err(_) => Err(WalletError::Unknown),
        }
      }
      Err(err) => Err(err),
    }
  }

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
  /// `InjectResult(init, offer, merge)`, where:
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
      Account::User(_) => Ok(InjectResult::ToUser(init, offer)),
      Account::System(_) => match self.balance_or_init(receiver, None, issuer).await {
        Ok(balance) => {
          match commit_tx! [
            tx! { merge &offer => balance; by issuer };
            to self
          ] {
            Ok([merged]) => Ok(InjectResult::ToSysUser(init, offer, merged)),
            Err(_) => Err(WalletError::Unknown),
          }
        }
        Err(err) => Err(err),
      },
      Account::Invalid => Err(WalletError::UnauthorizedTransaction),
    }
  }
}
