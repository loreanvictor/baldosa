
use std::sync::Arc;
use axum::{ extract::{ Query, Json }, http::StatusCode, response::IntoResponse, Extension };
use serde::Deserialize;
use log::{ info, error };

use super::super::config::Config;
use super::process::process_image;


#[derive(Deserialize)]
pub struct ProcessQuery {
  source: String,
}

#[derive(Deserialize)]
pub struct ProcessBody {
  x: i32,
  y: i32,
  title: String,
  subtitle: String,
  link: String,
}


pub async fn process(
  Extension(config): Extension<Arc<Config>>,
  Query(query): Query<ProcessQuery>,
  Json(body): Json<ProcessBody>,
) -> impl IntoResponse {
  info!("Processing image {}", query.source);
  match process_image(
    &query.source, body.x, body.y,
    &body.title, &body.subtitle, &body.link,
    config).await {
    Ok(_) => {
      info!("Processed image {}", query.source);
      StatusCode::OK.into_response()
    },
    Err(err) => {
      error!("Failed to process image, {}", err);
      StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
  }
}

