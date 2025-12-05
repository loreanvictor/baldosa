use std::sync::Arc;

use axum::{
  extract::{Json, Path},
  http::StatusCode,
  response::IntoResponse,
  Extension,
};
use image::Pixel;
use log::{error, info};
use serde::{Deserialize, Serialize};

use super::super::cartography::Storage as MapStorage;
use super::super::config::Config;
use super::{
  error::ImageError, io::interface::ImageInterface, publish::publish, unpublish::unpublish,
  util::parse_coords_from_path,
};

///
/// Expected body for publish requests.
///
#[derive(Deserialize)]
pub struct PublishBody {
  /// The source image to publish (for example URL in S3 bucket if S3 IO is used).
  source: String,
  /// The title of the image.
  title: Option<String>,
  /// The subtitle of the image.
  subtitle: Option<String>,
  /// The description of the image.
  description: Option<String>,
  /// The link of the produced tile.
  link: Option<String>,
  /// Any additional details about the image.
  details: Option<serde_json::Value>,
}

///
/// Publishes given image to given tile, producing
/// all necessary images with corresponding metadata. Responds
/// with a list of produced images, alongside a nominal color for the image
/// (to be used in minimaps and whatnot).
///
/// Example request:
/// ```
/// PUT https://publisher.cloud/32:-12
/// {
///   "source": "submitted-image.png",
///   "title": "my tile's title",
///   "subtitle": "it is pretty cool aint it?",
///   "link": "https://my.whatev.er"
/// }
/// ```
/// Example response:
/// ```
/// {
///   "color": [235, 171, 19],
///   "images": {
///     "0": "https://something.cloudfront.net/tile-32--12.jpg",
///     "1": "https://something.cloudfront.net/tile-32--12-1.jpg",
///     "24": "https://something.cloudfront.net/tile-32--12-24.jpg",
///     "48": "https://something.cloudfront.net/tile-32--12-48.jpg",
///     ...
///   }
/// }
/// ```
///
pub async fn publish_handler<IO: ImageInterface, Map: MapStorage<<IO as ImageInterface>::Pixel>>(
  Extension(config): Extension<Arc<Config>>,
  Extension(io): Extension<Arc<IO>>,
  Extension(map): Extension<Arc<Map>>,
  Path(coords): Path<String>,
  Json(body): Json<PublishBody>,
) -> Result<impl IntoResponse, ImageError>
where
  IO: 'static,
  <IO as ImageInterface>::Pixel: 'static,
  <<IO as ImageInterface>::Pixel as Pixel>::Subpixel: Serialize + Send + Sync + 'static,
{
  match parse_coords_from_path(coords.as_str()) {
    Some((Ok(x), Ok(y))) => {
      info!("Publishing {} to ({}, {})", body.source, x, y);
      let result = publish(
        &body.source,
        x,
        y,
        &body.title,
        &body.subtitle,
        &body.description,
        &body.link,
        &body.details,
        io,
        config,
      )
      .await
      .map_err(|err| {
        error!("Failed to publish {}, {:#}", body.source, err);
        err
      })?;
      info!("Published {} to ({}, {})", body.source, x, y);
      match &result.color {
        Some(color) => match map.put(&(x, y), color).await {
          Ok(()) => info!("Updated tilemap for ({}, {})", x, y),
          Err(err) => {
            error!("Failed to update tilemap for ({}, {}): {:#}", x, y, err)
          }
        },
        None => {}
      }
      Ok((StatusCode::OK, Json(result)))
    }
    _ => Err(ImageError::InvalidCoordinates),
  }
}

///
/// Unpublishes given tile, removing all images associated with it.
/// Will respond with a list of deleted image addresses.
///
/// Example request:
/// ```
/// DELETE https://publisher.cloud/32:-12
/// ```
/// Example response:
/// ```
/// {
///   "images": {
///     "0": "https://something.cloudfront.net/tile-32--12.jpg",
///     "1": "https://something.cloudfront.net/tile-32--12-1.jpg",
///     "24": "https://something.cloudfront.net/tile-32--12-24.jpg",
///     "48": "https://something.cloudfront.net/tile-32--12-48.jpg",
///     ...
///   }
/// }
/// ```
pub async fn unpublish_handler<IO: ImageInterface, Map: MapStorage<<IO as ImageInterface>::Pixel>>(
  Extension(config): Extension<Arc<Config>>,
  Extension(io): Extension<Arc<IO>>,
  Extension(map): Extension<Arc<Map>>,
  Path(coords): Path<String>,
) -> Result<impl IntoResponse, ImageError>
where
  IO: 'static,
  <IO as ImageInterface>::Pixel: 'static,
  <<IO as ImageInterface>::Pixel as Pixel>::Subpixel: Send + Sync + 'static,
{
  match parse_coords_from_path(coords.as_str()) {
    Some((Ok(x), Ok(y))) => {
      info!("Unpublishing ({}, {})", x, y);
      let result = unpublish(x, y, io, config)
        .await
        .map_err(|err| ImageError::IoError(err))?;
      info!("UnPublished ({}, {})", x, y);
      match map.delete(&(x, y)).await {
        Ok(()) => info!("Deleted tilemap for ({}, {})", x, y),
        Err(err) => error!("Failed to delete tilemap for ({}, {}): {}", x, y, err),
      }
      Ok((StatusCode::OK, Json(result)))
    }
    _ => Err(ImageError::InvalidCoordinates),
  }
}
