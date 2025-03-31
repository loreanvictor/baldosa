use webauthn_rs::prelude::*;
use std::{ env, sync::Arc };
use sqlx::{ Pool, postgres::Postgres };
use axum::{
  http::{ header, HeaderValue, Method },
  Router, routing::{ get, post, delete },
  extract::Extension
};
use tower_sessions::{
  cookie::{ time::Duration, SameSite },
  Expiry, MemoryStore, SessionManagerLayer,
};
use tower_http::cors::CorsLayer;
use log::info;

pub mod error;
pub mod user;
mod storage;
mod register;
mod authenticate;
mod passkeys;
mod email;


pub use user::AuthenticatedUser;
pub use error::AuthError;


pub fn router(db: &Pool<Postgres>) -> Router {
  let client_url = env::var("CLIENT_URL").expect("CLIENT_URL Must be set!");
  let rp_id = env::var("AUTH_DOMAIN").unwrap_or("localhost".to_string());
  let rp_name = env::var("AUTH_NAME").unwrap_or("Baldosa".to_string());
  let rp_origin = Url::parse(&client_url).expect("Invalid URL");

  let webauthn = WebauthnBuilder::new(&rp_id, &rp_origin)
    .expect("failed to create webauthn builder")
    .rp_name(&rp_name)
    .build()
    .expect("failed to build webauthn");

  let secure = client_url.starts_with("https://");

  // We need a cookie session store for auth / registration session data.
  // This is due to how webauthn works:
  //
  // 1) the client requests registration
  // 2) the server generates a challenge
  // 3) the client signs the challenge with (possibly a newly generated) key
  // 4) the server verifies the signature
  //
  // the challenges are ephemneral but we need to remember
  // which challenge was generated for which user. storing this
  // in db would open the database to unauthroized writes, which
  // is a security risk. so we use a cookie session store to store the
  // auth / registration state. the store is fully server side and secure.
  //
  let store = MemoryStore::default();
  let session = SessionManagerLayer::new(store)
    .with_secure(secure)
    .with_same_site(match secure {
      true => SameSite::None,
      false => SameSite::Lax,
      // 👆 when running locally, we can't have secure cookies, but we need
      //    the cookies to be cross site (since client is on a different domain).
      //    thats why we use LAX here. on prod, however, we have secure cookies
      //    so we can use NONE.
      //
    })
    .with_expiry(Expiry::OnInactivity(Duration::seconds(300)))
  ;

  // we need cross site cookies for the client to be able to
  // hold a session for their authentication / registration. however
  // cross site cookies are quite restricted so we need to specify
  // a lot of CORS parameters explicitly (not using wildcards) so
  // that browsers are satisfied.
  //
  let allowed_origin = match env::var("DEV_CLIENT_URL") {
    Ok(dev_client_url) => HeaderValue::from_str(&dev_client_url).unwrap(),
    Err(_) => HeaderValue::from_str(&client_url).unwrap(),
  };

  info!("allowed origin: {:?}", allowed_origin);

  let cors = CorsLayer::new()
    .allow_methods([ Method::POST, Method::GET, Method::DELETE ])
    .allow_origin(allowed_origin)
    .allow_headers([
      header::CONTENT_TYPE,
      header::AUTHORIZATION,
      header::ACCEPT,
      header::SET_COOKIE,
    ])
    .allow_credentials(true)
  ;

  let storage = storage::AuthStorage::new(db.clone());

  Router::new()
    .route("/register/start", post(register::start))
    .route("/register/finish", post(register::finish))
    .route("/authenticate/start", post(authenticate::start))
    .route("/authenticate/finish", post(authenticate::finish))
    .route("/passkeys", get(passkeys::all))
    .route("/passkeys/start", post(passkeys::start_adding))
    .route("/passkeys/finish", post(passkeys::finish_adding))
    .route("/passkeys/{id}", delete(passkeys::remove))
    .nest("/email", email::router())
    .layer(Extension(Arc::new(webauthn)))
    .layer(Extension(storage))
    .layer(session)
    .layer(cors)
}
