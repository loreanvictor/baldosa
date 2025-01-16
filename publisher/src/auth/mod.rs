use axum::{
  middleware::from_fn_with_state,
  Router,
};

use std::env;
use log::{warn, info};

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
pub fn protect(router: Router) -> Router {
  if let Ok(key) = env::var("AUTH_SIMPLE_KEY") {
    info!("Setting up authentication with a simple static key.");

    let state = simple_key::AuthState {
      key: Box::leak(key.into_boxed_str())
    };

    return router.layer(from_fn_with_state(state.clone(), simple_key::auth));
  } else {
    warn!("Could not protect the specified router because no authentication mechanism was specified.");
    return router;
  }
}
