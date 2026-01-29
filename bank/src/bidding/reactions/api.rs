use axum::{
  extract::{Extension, Json, Path},
  response::IntoResponse,
};
use log::error;
use serde::Deserialize;

use crate::auth::AuthenticatedUser;

use super::super::book::{Book, Coords};
use super::super::error::BiddingError;
use super::storage::{ReactionStore, ReactionType};

#[derive(Deserialize)]
pub struct ReactionRequest {
  pub reaction: ReactionType,
}

pub async fn react(
  Extension(book): Extension<Book>,
  Extension(reactions): Extension<ReactionStore>,
  Path(coords): Path<Coords>,
  user: AuthenticatedUser,
  Json(req): Json<ReactionRequest>,
) -> Result<(), BiddingError> {
  let occupant_bid = match book.get_occupant_bid(&coords).await {
    Ok(Some(bid)) => bid,
    Ok(None) => return Err(BiddingError::NotFound),
    Err(_) => return Err(BiddingError::Unknown),
  };

  reactions
    .set_reaction(&occupant_bid.id, req.reaction, &user)
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(())
}

pub async fn unreact(
  Extension(book): Extension<Book>,
  Extension(reactions): Extension<ReactionStore>,
  Path(coords): Path<Coords>,
  user: AuthenticatedUser,
  Json(req): Json<ReactionRequest>,
) -> Result<(), BiddingError> {
  let occupant_bid = match book.get_occupant_bid(&coords).await {
    Ok(Some(bid)) => bid,
    Ok(None) => return Err(BiddingError::NotFound),
    Err(_) => return Err(BiddingError::Unknown),
  };

  reactions
    .clear_reaction(&occupant_bid.id, req.reaction, &user)
    .await
    .map_err(|err| {
      error!("Failed to clear reaction: {:?}", err);
      BiddingError::Unknown
    })?;

  Ok(())
}

pub async fn reactions(
  Extension(book): Extension<Book>,
  Extension(reactions): Extension<ReactionStore>,
  Path(coords): Path<Coords>,
  user: Option<AuthenticatedUser>,
) -> Result<impl IntoResponse, BiddingError> {
  let occupant_bid = match book.get_occupant_bid(&coords).await {
    Ok(Some(bid)) => bid,
    Ok(None) => return Err(BiddingError::NotFound),
    Err(_) => return Err(BiddingError::Unknown),
  };

  let reaction = reactions
    .reactions_summary(&occupant_bid.id, user.as_ref())
    .await
    .map_err(|_| BiddingError::Unknown)?;

  Ok(Json(reaction))
}
