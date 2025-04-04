use std::{env, sync::Arc};

use axum::{
  extract::{ FromRequestParts, Extension },
  http::request::Parts,
  response::{IntoResponse, Response},
};

use super::error::AuthError;
use super::user::AuthenticatedUser;

pub struct AdminConfig {
  pub admins: Vec<String>,
  pub admin_key: String,
}

impl AdminConfig {
  pub fn init() -> Arc<Self> {
    let admin_key = env::var("ADMIN_KEY").expect("ADMIN_KEY must be set");
    let admins = env::var("ADMIN_USERS").expect("ADMIN_USERS must be set")
      .split(',')
      .map(|s| s.trim().to_string())
      .collect();
    Arc::new(AdminConfig { admins, admin_key })
  }
}

pub struct AdminUser(pub AuthenticatedUser);

impl<S> FromRequestParts<S> for AdminUser
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    let user = AuthenticatedUser::from_request_parts(parts, _state).await.map_err(IntoResponse::into_response)?;
    let Extension(config): Extension<Arc<AdminConfig>> =
      Extension::from_request_parts(parts, _state).await.map_err(IntoResponse::into_response)?;

    if !config.admins.contains(&user.email) {
      return Err(AuthError::InsufficientPermissions.into_response());
    }

    let headers = parts.headers.clone();
    match headers
      .get("X-Admin-Key")
      .and_then(|value| value.to_str().ok())
    {
      Some(key) if key == config.admin_key => Ok(AdminUser(user)),
      _ => Err(AuthError::InvalidCredentials.into_response()),
    }
  }
}
