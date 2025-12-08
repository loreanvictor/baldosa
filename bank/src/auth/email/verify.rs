use std::sync::Arc;

use axum::{
  extract::{Extension, Json, State},
  response::IntoResponse,
};
use serde::Deserialize;

use super::super::error::AuthError;
use super::super::storage::AuthStorage;
use super::super::AuthenticatedUser;
use super::code::CodesRepository;

#[derive(Deserialize, Debug)]
pub struct VerifyEmailBody {
  pub code: String,
}

pub async fn verify(
  State(codes): State<Arc<CodesRepository>>,
  Extension(storage): Extension<AuthStorage>,
  user: AuthenticatedUser,
  Json(body): Json<VerifyEmailBody>,
) -> Result<impl IntoResponse, AuthError> {
  codes.verify(&user.email, &body.code, "verify_email")?;

  match storage.verify_user_email(user.id).await {
    Ok(Some(_)) => Ok(()),
    _ => Err(AuthError::Unknown),
  }
}
