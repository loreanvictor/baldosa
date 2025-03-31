use std::sync::Arc;
use resend_rs::Resend;
use axum::{ Router, routing::post, extract::Extension };

use code::CodesRepository;

mod code;
mod authenticate;
mod verify;
mod send;


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
