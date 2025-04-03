use axum::{
  extract::{Extension, Json, Query},
  response::IntoResponse,
};
use serde::{Deserialize, Serialize};

use super::account::Account;
use super::auth::UsableInboundOffer;
use super::error::WalletError;
use super::ledger::Ledger;
use super::ops::OfferResult;
use super::{super::auth::AuthenticatedUser, auth::UsableOutgoingOffer, Transaction};

pub async fn balance(
  Extension(ledger): Extension<Ledger>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .balance_or_init(&Account::of_user(&user.id), None, &user)
    .await
    .and_then(|tx| Ok(Json(tx)))
}

pub async fn accept(
  Extension(ledger): Extension<Ledger>,
  UsableInboundOffer(offer, user): UsableInboundOffer,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .accept_offer(&offer, &user)
    .await
    .and_then(|tx| Ok(Json(tx)))
}

pub async fn reject(
  Extension(ledger): Extension<Ledger>,
  UsableInboundOffer(offer, user): UsableInboundOffer,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .reject_offer(&offer, None, &user)
    .await
    .and_then(|tx| Ok(Json(tx)))
}

pub async fn rescind(
  Extension(ledger): Extension<Ledger>,
  UsableOutgoingOffer(offer, user): UsableOutgoingOffer,
) -> Result<impl IntoResponse, WalletError> {
  ledger
    .rescind_offer(&offer, &user)
    .await
    .and_then(|tx| Ok(Json(tx)))
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
    .and_then(|txs| Ok(Json(txs)))
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
    .and_then(|txs| Ok(Json(txs)))
    .map_err(|_| WalletError::Unknown)
}

#[derive(Deserialize)]
pub struct OfferBody {
  pub amount: u32,
  pub receiver_sys: String,
  pub note: Option<String>,
}

#[derive(Serialize)]
pub struct OfferResponse {
  pub offered: Transaction,
  pub rest: Transaction,
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
    Ok(OfferResult(offered, rest)) => Ok(Json(OfferResponse { offered, rest })),
    Err(err) => Err(err),
  }
}

//
// TODO: how about some admin APIs?
//
