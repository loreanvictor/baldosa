use std::env;

use axum::{
  extract::FromRequestParts,
  http::request::Parts,
  response::{IntoResponse, Response},
};
use chrono::{DateTime, Days, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use log::error;
use serde::{Deserialize, Serialize};
use webauthn_rs::prelude::Uuid;

use super::storage::StoredUser;
use super::AuthError;

///
/// Represents the verification status of a user.
/// Including all potential verifications they have had.
///
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct VerificationStatus {
  ///
  /// When the user's email was verified, `None` if not verified.
  ///
  pub email_verified_at: Option<DateTime<Utc>>,
}

impl VerificationStatus {
  pub fn from(user: &StoredUser) -> Self {
    Self {
      email_verified_at: user.email_verified_at,
    }
  }

  pub fn verified(at: DateTime<Utc>) -> Self {
    Self {
      email_verified_at: Some(at),
    }
  }
}

///
/// Represents an authenticated user,
/// including a signed token that can be used
/// to authenticate future requests.
///
/// Use this struct to extract the currently
/// logged in user from requests:
///
/// Example:
/// ```rs
/// pub async fn my_handler(
///   user: AuthenticatedUser,
///   Json(body): Json<MyRequestBody>,
/// ) -> Result<impl IntoResponse, MyError> {
///   // ...
/// }
/// ```
///
/// You can also use it to generally pass validated
/// information about a logged in user in other layers
/// of application logic.
///
/// Note that for extraction to work, `JWT_SECRET` environment variable
/// must be set, and it can only extract users that are signed with
/// the same secret (so changing the secret effectively logs out all users).
///
#[derive(Serialize, Debug)]
pub struct AuthenticatedUser {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub verification: VerificationStatus,
  pub token: String,
}

///
/// Denotes the set of claims verified
/// by a user token in an `AuthenticatedUser`.
///
#[derive(Serialize, Deserialize, Debug)]
pub struct UserClaim {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub verification: VerificationStatus,
  pub exp: usize,
}

impl AuthenticatedUser {
  ///
  /// Generates a signed token for a user.
  /// Returns an `AuthenticatedUser` containing the token,
  /// which also attests the rest of the fields.
  ///
  /// This requires the `JWT_SECRET` environment variable to be set.
  ///
  pub fn sign(
    id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
    verification: VerificationStatus,
  ) -> Self {
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let key = EncodingKey::from_secret(secret.as_ref());
    let header = Header::default();
    let claim = UserClaim {
      id,
      email: email.clone(),
      first_name: first_name.clone(),
      last_name: last_name.clone(),
      verification: verification.clone(),
      exp: usize::try_from(
        Utc::now()
          .checked_add_days(Days::new(1000))
          .unwrap()
          .timestamp(),
      )
      .unwrap_or_default(),
    };
    let token = encode(&header, &claim, &key).unwrap();
    //
    // TODO: this 👆 is not the most secure way of doing this,
    // and should be augmented with refresh tokens and secure cookies.
    //
    // - add short expiry to the JWT token
    // - add opaque refresh token to the session (cookie)
    // - add refresh token to the database
    // - refresh endpoint rotates both tokens
    // - logout removes refresh token from DB
    //

    Self {
      id,
      email,
      first_name,
      last_name,
      verification,
      token,
    }
  }
}

impl<S> FromRequestParts<S> for AuthenticatedUser
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    let headers = parts.headers.clone();
    let Some(token) = headers
      .get("Authorization")
      .and_then(|value| value.to_str().ok())
      .and_then(|value| value.strip_prefix("Bearer "))
    else {
      error!("Missing Authorization header");
      return Err(AuthError::InvalidCredentials.into_response());
    };

    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let key = DecodingKey::from_secret(secret.as_ref());

    match decode::<UserClaim>(token, &key, &Validation::default()) {
      Ok(token_data) => Ok(AuthenticatedUser {
        id: token_data.claims.id,
        email: token_data.claims.email,
        first_name: token_data.claims.first_name,
        last_name: token_data.claims.last_name,
        verification: token_data.claims.verification,
        token: token.to_string(),
      }),
      Err(err) => {
        error!("Invalid token: {:?}, {:?}", &token, err);
        Err(AuthError::InvalidCredentials.into_response())
      }
    }
  }
}
