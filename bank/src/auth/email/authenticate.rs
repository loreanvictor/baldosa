use std::sync::Arc;

use axum::{
  extract::{Extension, Json, State},
  response::IntoResponse,
};
use serde::Deserialize;

use super::super::error::AuthError;
use super::super::storage::AuthStorage;
use super::super::user::{AuthenticatedUser, VerificationStatus};
use super::code::CodesRepository;

#[derive(Deserialize, Debug)]
pub struct AuthenticateWithEmailBody {
  pub email: String,
  pub code: String,
}

pub async fn authenticate(
  State(codes): State<Arc<CodesRepository>>,
  Extension(storage): Extension<AuthStorage>,
  Json(body): Json<AuthenticateWithEmailBody>,
) -> Result<impl IntoResponse, AuthError> {
  let user = match storage.find_user_by_email(&body.email).await {
    Ok(Some(user)) => user,
    _ => {
      return Err(AuthError::UserNotFound);
    }
  };

  match codes.verify(&user.id, &body.code, "auth_with_email").await {
    Ok(()) => (),
    Err(err) => {
      return Err(err);
    }
  }

  match storage.verify_user_email(user.id).await {
    Ok(Some(user)) => {
      let verification = VerificationStatus::from(&user);
      Ok(Json(AuthenticatedUser::sign(
        user.id,
        user.email,
        user.first_name,
        user.last_name,
        verification,
      )))
    }
    _ => Err(AuthError::Unknown),
  }
}
