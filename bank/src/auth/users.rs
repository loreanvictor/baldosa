use axum::{
  extract::{Extension, Json, Path, Query},
  response::{IntoResponse, Response},
  routing::get,
  Router,
};
use serde::Deserialize;
use sqlx::types::Uuid;
use tower_http::cors::{Any, CorsLayer};

use super::admin::AdminUser;
use super::error::AuthError;
use super::storage::AuthStorage;

#[derive(Deserialize)]
pub struct UsersOptions {
  pub offset: Option<u32>,
  pub limit: Option<u32>,
  pub email: Option<String>,
}

async fn users(
  Extension(storage): Extension<AuthStorage>,
  Query(UsersOptions {
    offset,
    limit,
    email,
  }): Query<UsersOptions>,
  AdminUser(_): AdminUser,
) -> Result<Response, AuthError> {
  if let Some(email) = email {
    Ok(
      storage
        .find_user_by_email(&email)
        .await
        .map_err(|_| AuthError::Unknown)?
        .map(Json)
        .ok_or(AuthError::UserNotFound)?
        .into_response(),
    )
  } else {
    Ok(
      storage
        .get_users(offset.unwrap_or(0), limit.unwrap_or(32))
        .await
        .map(Json)
        .map_err(|_| AuthError::Unknown)?
        .into_response(),
    )
  }
}

async fn user(
  Extension(storage): Extension<AuthStorage>,
  Path(id): Path<Uuid>,
  AdminUser(_): AdminUser,
) -> Result<impl IntoResponse, AuthError> {
  let user = storage
    .find_user_by_id(id)
    .await
    .map_err(|_| AuthError::Unknown)?
    .ok_or_else(|| AuthError::UserNotFound)?;

  Ok(Json(user))
}

pub fn router() -> Router {
  let cors = CorsLayer::new()
    .allow_methods(Any)
    .allow_headers(Any)
    .allow_origin(Any);

  Router::new()
    .route("/", get(users))
    .route("/{id}", get(user))
    .layer(cors)
}
