
use serde::Serialize;
use std::{ io::{ Error as IOError, ErrorKind }, sync::Arc };
use axum::{ extract::{ Path, Json }, http::StatusCode, response::IntoResponse, Extension };
use serde::Deserialize;
use image::Pixel;
use log::{ info, error };

use super::{super::config::Config, io::interface::ImageInterface };
use super::{ publish::publish, unpublish::unpublish };


#[derive(Deserialize)]
pub struct PublishBody {
  source: String,
  title: String,
  subtitle: String,
  link: String,
}


pub async fn publish_handler<IO: ImageInterface>(
  Extension(config): Extension<Arc<Config>>,
  Extension(io): Extension<Arc<IO>>,
  Path(coords): Path<String>,
  Json(body): Json<PublishBody>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)>
  where
    IO: 'static,
    <IO as ImageInterface>::Pixel: 'static,
    <<IO as ImageInterface>::Pixel as Pixel>::Subpixel: Serialize + Send + Sync + 'static, {
  match coords
    .split_once(':')
    .map(|(x, y)| (x.parse::<i32>(), y.parse::<i32>())) {
    Some((Ok(x), Ok(y))) => {
      info!("Publishing {} to ({}, {})", body.source, x, y);
      match publish(
        &body.source, x, y,
        &body.title, &body.subtitle, &body.link,
        io,
        config
      ).await {
        Ok(result) => {
          info!("Published {} to ({}, {})", body.source, x, y);
          Ok((StatusCode::OK, Json(result)))
        },
        Err(err) => {
          error!("Failed to publish {}, {}", body.source, err);
          match err.downcast_ref::<IOError>() {
            Some(err) if err.kind() == ErrorKind::NotFound =>
              Err((StatusCode::NOT_FOUND, "Image not found")),
            Some(err) if err.kind() == ErrorKind::InvalidInput =>
              Err((StatusCode::BAD_REQUEST, "Invalid file format")),
            _ => Err((StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong")),
          }
        }
      }
    },
    _ => Err((StatusCode::BAD_REQUEST, "Invalid coordinates"))
  }
}

pub async fn unpublish_handler<IO: ImageInterface>(
  Extension(config): Extension<Arc<Config>>,
  Extension(io): Extension<Arc<IO>>,
  Path(coords): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)>
  where
    IO: 'static,
    <IO as ImageInterface>::Pixel: 'static,
    <<IO as ImageInterface>::Pixel as Pixel>::Subpixel: Send + Sync + 'static {
  match coords
    .split_once(':')
    .map(|(x, y)| (x.parse::<i32>(), y.parse::<i32>())) {
    Some((Ok(x), Ok(y))) => {
      info!("Unpublishing ({}, {})", x, y);
      match unpublish(x, y, io, config).await {
        Ok(result) => {
          info!("UnPublished ({}, {})", x, y);
          Ok((StatusCode::OK, Json(result)))
        },
        // TODO: improve error handling here
        _ => Err((StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong")),
      }
    },
    _ => Err((StatusCode::BAD_REQUEST, "Invalid coordinates"))
  }
}
