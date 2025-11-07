use std::{env, sync::Arc};

use axum::{
  extract::{Extension, FromRequestParts},
  http::request::Parts,
  response::{IntoResponse, Response},
};

use super::error::AuthError;
use super::user::AuthenticatedUser;

///
/// Configuration for admin users.
/// Admins are authenticated users with emails from
/// a configured list, who also provide a special key
/// (that can be rotated constantly for security).
/// This means admin authentication is on top of the normal
/// authentication, with a simple key check on top.
///
/// > **WARNING** \
/// > Make sure this config is read from the environment,
/// > and not a config file that is prone to be committed.
///
pub struct AdminConfig {
  // List of admin emails
  pub admins: Vec<String>,
  pub admin_key: String,
}

impl AdminConfig {
  pub fn init() -> Arc<Self> {
    let admin_key = env::var("ADMIN_KEY").expect("ADMIN_KEY must be set");
    let admins = env::var("ADMIN_USERS")
      .expect("ADMIN_USERS must be set")
      .split(',')
      .map(|s| s.trim().to_string())
      .collect();
    Arc::new(AdminConfig { admins, admin_key })
  }
}

///
/// A wrapper around `AuthenticatedUser`
/// that requires the user to be an admin. This struct
/// can be used to ensure a logged in admin user is
/// making a request, and that configured admin key is provided
/// via the `X-Admin-Key` header.
///
/// ```rs
/// pub async fn my_handler(
///   AdminUser(user): AdminUser,
///   Json(body): Json<MyRequestBody>,
/// ) -> Result<impl IntoResponse, MyError> {
///   // ...
/// }
/// ```
///
pub struct AdminUser(pub AuthenticatedUser);

impl<S> FromRequestParts<S> for AdminUser
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    let user = AuthenticatedUser::from_request_parts(parts, state)
      .await
      .map_err(IntoResponse::into_response)?;
    let Extension(config): Extension<Arc<AdminConfig>> =
      Extension::from_request_parts(parts, state)
        .await
        .map_err(IntoResponse::into_response)?;

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
