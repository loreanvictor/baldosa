use axum::{
  extract::Extension,
  routing::{get, post},
  Router,
};
use sqlx::{postgres::Postgres, Pool};
use tower_http::cors::{Any, CorsLayer};

mod account;
mod api;
pub mod auth;
pub mod error;
mod ledger;
mod macros;
pub mod operations;
mod transaction;

pub use account::Account;
pub use ledger::Ledger;
pub use transaction::Transaction;

pub fn router(db: &Pool<Postgres>) -> Router {
  let cors = CorsLayer::new()
    .allow_methods(Any)
    .allow_headers(Any)
    .allow_origin(Any);

  let ledger = Ledger::new(db.clone());

  Router::new()
    .route("/balance", get(api::balance))
    .route("/offers", get(api::offers))
    .route("/history", get(api::history))
    .route("/accept", post(api::accept))
    .route("/reject", post(api::reject))
    .route("/rescind", post(api::rescind))
    .route("/offer", post(api::offer))
    // --- ADMIN APIS --- \\
    .route("/admin/inject", post(api::inject))
    .route("/admin/partially-accept", post(api::partially_accept))
    // --- LAYERS --- \\
    .layer(Extension(ledger))
    .layer(cors)
}
