use axum::{
  extract::{Extension, Json, Path, Query},
  response::IntoResponse,
};
use serde::Deserialize;
use sqlx::types::Uuid;

use super::super::auth::{admin::AdminUser, AuthenticatedUser};
use super::account::Account;
use super::auth::{UsableInboundOffer, UsableOutgoingOffer};
use super::error::WalletError;
use super::ledger::Ledger;

pub async fn balance(
  Extension(ledger): Extension<Ledger>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .balance_or_init(&Account::of_user(&user.id), None, &user)
    .await
    .map(Json)
}

pub async fn accept(
  Extension(ledger): Extension<Ledger>,
  UsableInboundOffer(offer, user): UsableInboundOffer,
) -> Result<impl IntoResponse, WalletError> {
  ledger.accept_offer(&offer, &user).await.map(Json)
}

pub async fn reject(
  Extension(ledger): Extension<Ledger>,
  UsableInboundOffer(offer, user): UsableInboundOffer,
) -> Result<impl IntoResponse, WalletError> {
  ledger.reject_offer(&offer, None, &user).await.map(Json)
}

pub async fn rescind(
  Extension(ledger): Extension<Ledger>,
  UsableOutgoingOffer(offer, user): UsableOutgoingOffer,
) -> Result<impl IntoResponse, WalletError> {
  ledger.rescind_offer(&offer, &user).await.map(Json)
}

#[derive(Deserialize)]
pub struct Pagination {
  pub offset: Option<u32>,
  pub limit: Option<u32>,
}

pub async fn offers(
  Extension(ledger): Extension<Ledger>,
  Query(Pagination { offset, limit }): Query<Pagination>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .find_open_offers(
      &Account::of_user(&user.id),
      offset.unwrap_or(0),
      limit.unwrap_or(32),
    )
    .await
    .map(Json)
    .map_err(|_| WalletError::Unknown)
}

pub async fn history(
  Extension(ledger): Extension<Ledger>,
  user: AuthenticatedUser,
  Query(Pagination { offset, limit }): Query<Pagination>,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .transaction_history(&user.id, offset.unwrap_or(0), limit.unwrap_or(32))
    .await
    .map(Json)
    .map_err(|_| WalletError::Unknown)
}

#[derive(Deserialize)]
pub struct OfferBody {
  pub amount: u32,
  pub receiver_sys: String,
  pub note: Option<String>,
}

pub async fn offer(
  Extension(ledger): Extension<Ledger>,
  user: AuthenticatedUser,
  Json(body): Json<OfferBody>,
) -> Result<impl IntoResponse, WalletError> {
  match ledger
    .offer_from_balance(
      &Account::of_user(&user.id),
      &Account::of_sys_user(&body.receiver_sys),
      body.amount,
      body.note,
      &user,
    )
    .await
  {
    Ok(result) => Ok(Json(result)),
    Err(err) => Err(err),
  }
}

#[derive(Deserialize)]
pub struct InjectBody {
  pub amount: u32,
  pub receiver: Account,
  pub note: Option<String>,
}

pub async fn inject(
  Extension(ledger): Extension<Ledger>,
  AdminUser(user): AdminUser,
  Json(body): Json<InjectBody>,
) -> Result<impl IntoResponse, WalletError> {
  match ledger
    .inject(&body.receiver, body.amount, body.note, &user)
    .await
  {
    Ok(result) => Ok(Json(result)),
    Err(err) => Err(err),
  }
}

pub async fn user_balance(
  Extension(ledger): Extension<Ledger>,
  Path(id): Path<Uuid>,
  AdminUser(_): AdminUser,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .find_balance(&Account::of_user(&id))
    .await
    .map(Json)
    .map_err(|_| WalletError::TransactionNotFound)
}

#[derive(Deserialize)]
pub struct PartiallyAcceptBody {
  pub offer: Uuid,
  pub amount: u32,
  pub note: Option<String>,
}

pub async fn partially_accept(
  Extension(ledger): Extension<Ledger>,
  AdminUser(user): AdminUser,
  Json(body): Json<PartiallyAcceptBody>,
) -> Result<impl IntoResponse, WalletError> {
  let offer = ledger
    .get_transaction(&body.offer)
    .await
    .map_err(|_| WalletError::TransactionNotFound)?;

  if offer.is_used() {
    return Err(WalletError::AlreadyUsedTransaction);
  }

  if offer.receiver_sys.is_none() {
    return Err(WalletError::UnauthorizedTransaction);
  }

  match ledger
    .partially_accept_offer(&offer, body.amount, body.note, &user)
    .await
  {
    Ok(result) => Ok(Json(result)),
    Err(err) => Err(err),
  }
}
