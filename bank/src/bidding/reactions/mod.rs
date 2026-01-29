use axum::{
  extract::Extension,
  routing::{delete, get, post},
  Router,
};
use sqlx::{postgres::Postgres, Pool};
use storage::ReactionStore;

mod api;
mod storage;

pub fn router(db: &Pool<Postgres>) -> Router {
  let reactions = ReactionStore::new(db.clone());

  Router::new()
    .route("/", get(api::reactions))
    .route("/", post(api::react))
    .route("/", delete(api::unreact))
    .layer(Extension(reactions))
}
