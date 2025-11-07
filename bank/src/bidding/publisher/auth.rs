use std::env;

use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use reqwest::RequestBuilder;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct AuthClaims {
  sub: String,
  exp: usize,
}

#[derive(Debug, Clone)]
pub enum Auth {
  None,
  SimpleKey(String),
  Jwt { secret: String, subject: String },
}

impl Auth {
  pub fn from_env() -> Self {
    if let Ok(jwt_secret) = env::var("PUBLISHER_AUTH_JWT_SECRET") {
      let subject =
        env::var("PUBLISHER_AUTH_JWT_SUBJECT").expect("Missing PUBLISHER_AUTH_JWT_SUBJECT");
      Auth::Jwt {
        secret: jwt_secret,
        subject,
      }
    } else if let Ok(key) = env::var("PUBLISHER_AUTH_SIMPLE_KEY") {
      Auth::SimpleKey(key)
    } else {
      Auth::None
    }
  }

  pub fn apply(&self, builder: RequestBuilder) -> RequestBuilder {
    match self {
      Auth::None => builder,
      Auth::SimpleKey(key) => builder.header("Authorization", format!("Bearer {key}")),
      Auth::Jwt { secret, subject } => {
        let token = encode(
          &Header::default(),
          &AuthClaims {
            sub: subject.to_owned(),
            exp: usize::try_from((Utc::now() + Duration::minutes(5)).timestamp())
              .unwrap_or_default(),
          },
          &EncodingKey::from_secret(secret.as_ref()),
        )
        .unwrap();

        builder.header("Authorization", format!("Bearer {token}"))
      }
    }
  }
}
