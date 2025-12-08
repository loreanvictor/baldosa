use std::sync::Arc;

use axum::{
  extract::{Extension, Json, State},
  response::IntoResponse,
};
use serde::Deserialize;
use webauthn_rs::prelude::Uuid;

use super::super::error::AuthError;
use super::super::storage::AuthStorage;
use super::super::user::{AuthenticatedUser, VerificationStatus};
use super::code::CodesRepository;

#[derive(Deserialize, Debug)]
pub struct RegisterWithEmailBody {
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub code: String,
}

pub async fn register(
  State(codes): State<Arc<CodesRepository>>,
  Extension(storage): Extension<AuthStorage>,
  Json(body): Json<RegisterWithEmailBody>,
) -> Result<impl IntoResponse, AuthError> {
  if let Some(_) = storage
    .find_user_by_email(body.email.as_str())
    .await
    .map_err(|_| AuthError::Unknown)?
  {
    return Err(AuthError::UserExists);
  }

  codes.verify(&body.email, &body.code, "reg_with_email")?;
  let unique_user_id = Uuid::new_v4();

  storage
    .create_user(
      unique_user_id,
      body.email.as_str(),
      body.first_name.as_str(),
      body.last_name.as_str(),
    )
    .await
    .map_err(|_| AuthError::Unknown)?;

  storage
    .verify_user_email(unique_user_id)
    .await
    .map_err(|_| AuthError::Unknown)?;

  Ok(Json(AuthenticatedUser::sign(
    unique_user_id,
    body.email,
    body.first_name,
    body.last_name,
    VerificationStatus::verified(chrono::Utc::now()),
  )))
}
