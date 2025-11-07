use std::sync::Arc;

use axum::{extract::Extension, routing::post, Router};
use code::CodesRepository;
use resend_rs::Resend;

mod authenticate;
mod code;
mod send;
mod verify;

pub fn router() -> Router {
  let codes = CodesRepository::new();
  let resend = Resend::default();

  Router::new()
    .route("/code", post(send::send_auth_otc))
    .route("/authenticate", post(authenticate::authenticate))
    .route("/verification-code", post(send::send_verification_code))
    .route("/verify", post(verify::verify))
    .layer(Extension(resend))
    .with_state(Arc::new(codes))
}
