use std::env;
use axum::{ extract::FromRequestParts, http::request::Parts, response::{ IntoResponse, Response } };
use webauthn_rs::prelude::Uuid;
use serde::{ Deserialize, Serialize };
use chrono::{ Utc, Days };
use jsonwebtoken::{ encode, decode, DecodingKey, EncodingKey, Header, Validation };

use log::error;

use super::AuthError;


#[derive(Serialize, Debug)]
pub struct AuthenticatedUser {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub token: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserClaim {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub exp: usize,
}

impl AuthenticatedUser {
  pub fn sign(
    id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
  ) -> Self {
    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let key = EncodingKey::from_secret(secret.as_ref());
    let header = Header::default();
    let claim = UserClaim {
      id,
      email: email.clone(),
      first_name: first_name.clone(),
      last_name: last_name.clone(),
      exp: Utc::now().checked_add_days(Days::new(1000)).unwrap().timestamp() as usize, // TODO: set expiration time
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
      token,
    }
  }
}

impl <S> FromRequestParts<S> for AuthenticatedUser
where
  S: Send + Sync,
{
  type Rejection = Response;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    let headers = parts.headers.clone();
    let token = match headers.get("Authorization")
      .and_then(|value| value.to_str().ok())
      .and_then(|value| value.strip_prefix("Bearer ")) {
      Some(token) => token,
      None => {
        error!("Missing Authorization header");
        return Err(AuthError::InvalidCredentials.into_response())
      },
    };

    let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let key = DecodingKey::from_secret(secret.as_ref());

    match decode::<UserClaim>(&token, &key, &Validation::default()) {
      Ok(token_data) => Ok(AuthenticatedUser {
        id: token_data.claims.id,
        email: token_data.claims.email,
        first_name: token_data.claims.first_name,
        last_name: token_data.claims.last_name,
        token: token.to_string(),
      }),
      Err(err) => {
        error!("Invalid token: {:?}, {:?}", &token, err);
        Err(AuthError::InvalidCredentials.into_response())
      },
    }
  }
}
