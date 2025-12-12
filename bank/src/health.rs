use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};

pub fn router() -> Router {
  let cors = CorsLayer::new()
    .allow_methods(Any)
    .allow_headers(Any)
    .allow_origin(Any);

  Router::new().route("/", get(|| async { "OK" })).layer(cors)
}
