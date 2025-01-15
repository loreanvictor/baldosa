
use std::{ io::{ Error as IOError, ErrorKind }, sync::Arc };
use axum::{ extract::{ Query, Json }, http::StatusCode, response::IntoResponse, Extension };
use serde::Deserialize;
use aws_sdk_s3::Client as S3Client;
use log::{ info, error };

use super::super::config::Config;
use super::publish::publish;
use super::io::S3JpegInterface  as IO;

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


pub async fn publish_handler(
  Extension(config): Extension<Arc<Config>>,
  Extension(s3): Extension<Arc<S3Client>>,
  Query(query): Query<ProcessQuery>,
  Json(body): Json<ProcessBody>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
  info!("Processing image {}", query.source);
  let interface = IO::new(Arc::clone(&s3), None, None);
  match publish(
    &query.source, body.x, body.y,
    &body.title, &body.subtitle, &body.link,
    Arc::new(interface),
    config
  ).await {
    Ok(result) => {
      info!("Processed image {}", query.source);
      Ok((StatusCode::OK, Json(result)))
    },
    Err(err) => {
      error!("Failed to process image, {}", err);
      match err.downcast_ref::<IOError>() {
        Some(err) if err.kind() == ErrorKind::NotFound =>
          Err((StatusCode::NOT_FOUND, "Image not found")),
        Some(err) if err.kind() == ErrorKind::InvalidInput =>
          Err((StatusCode::BAD_REQUEST, "Invalid file format")),
        _ => Err((StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong")),
      }
    }
  }
}
