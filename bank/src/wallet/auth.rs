use axum::{
  body::to_bytes,
  extract::{Extension, FromRequest, FromRequestParts, Json, Request},
  response::{IntoResponse, Response},
};

use super::super::auth::AuthenticatedUser;
use super::error::WalletError;
use super::ledger::Ledger;
use super::transaction::Transaction;

pub struct UsableTransaction(pub Transaction, pub AuthenticatedUser);

impl<S> FromRequest<S> for UsableTransaction
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
    let (mut parts, body) = req.into_parts();
    let bytes = to_bytes(body, usize::MAX)
      .await
      .map_err(|_| WalletError::TransactionNotFound.into_response())?;

    let Json(rtx) = Json::<Transaction>::from_bytes(bytes.as_ref())
      .map_err(|_| WalletError::TransactionNotFound.into_response())?;

    let user = AuthenticatedUser::from_request_parts(&mut parts, state)
      .await
      .map_err(IntoResponse::into_response)?;

    let Extension(ledger) = Extension::<Ledger>::from_request_parts(&mut parts, state)
      .await
      .map_err(IntoResponse::into_response)?;

    let tx = match rtx.id {
      Some(id) => ledger
        .get_transaction(&id)
        .await
        .map_err(|_| WalletError::TransactionNotFound.into_response())?,
      None => return Err(WalletError::TransactionNotFound.into_response()),
    };

    if tx.is_used() {
      return Err(WalletError::AlreadyUsedTransaction.into_response());
    }

    if !tx.is_usable_by_user(&user.id) {
      return Err(WalletError::UnauthorizedTransaction.into_response());
    }

    Ok(UsableTransaction(tx, user))
  }
}

pub struct UsableInboundOffer(pub Transaction, pub AuthenticatedUser);

impl<S> FromRequest<S> for UsableInboundOffer
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
    let UsableTransaction(tx, user) = UsableTransaction::from_request(req, state).await?;

    if !tx.is_offer() {
      return Err(WalletError::ErroneousTransaction.into_response());
    }

    if !tx.is_usable_offer_to(&user.id) {
      return Err(WalletError::UnauthorizedTransaction.into_response());
    }

    Ok(UsableInboundOffer(tx, user))
  }
}

pub struct UsableOutgoingOffer(pub Transaction, pub AuthenticatedUser);

impl<S> FromRequest<S> for UsableOutgoingOffer
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
    let UsableTransaction(tx, user) = UsableTransaction::from_request(req, state).await?;

    if !tx.is_offer() {
      return Err(WalletError::ErroneousTransaction.into_response());
    }

    if !tx.is_usable_offer_from(&user.id) {
      return Err(WalletError::UnauthorizedTransaction.into_response());
    }

    Ok(UsableOutgoingOffer(tx, user))
  }
}
