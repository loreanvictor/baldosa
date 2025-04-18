use std::env;

use axum::{middleware::from_fn_with_state, Router};
use log::{info, warn};

mod jwt;
mod simple_key;

///
/// Sets up authentication for a given router.
/// Will determine the authentication mechanism using environment variables.
/// You can use one of the following auth mechanisms:
///
/// ### Simple static key
/// Each incoming request should have a predetermined key in its headers.
/// Use it by providing the `AUTH_SIMPLE_KEY` environment variable (set it to the expected key).
/// Incoming requests should then have `Authorization: Bearer <key>` in their headers.
///
/// ### JWT
/// Each incoming request should have a JWT in its headers.
/// Use it by providing the `AUTH_JWT_SECRET` environment variable (set it to the JWT secret),
/// and the `AUTH_JWT_SUBJECT` environment variable (set it to the expected subject).
/// Incoming requests should then have `Authorization: Bearer <jwt>` in their headers.
///
pub fn protect(router: Router) -> Router {
  if let Ok(jwt_secret) = env::var("AUTH_JWT_SECRET") {
    info!("Setting up authentication with JWT.");
    let subject = env::var("AUTH_JWT_SUBJECT")
      .expect("You must set AUTH_JWT_SUBJECT to protect publisher APIs with JWT.");

    let state = jwt::JwtState {
      secret: jwt_secret,
      subject,
    };
    router.layer(from_fn_with_state(state.clone(), jwt::auth))
  } else if let Ok(key) = env::var("AUTH_SIMPLE_KEY") {
    info!("Setting up authentication with a simple static key.");
    let state = simple_key::AuthState {
      key: key.to_string(),
    };
    router.layer(from_fn_with_state(state.clone(), simple_key::auth))
  } else {
    warn!(
      "Could not protect the specified router because no authentication mechanism was specified."
    );
    router
  }
}
