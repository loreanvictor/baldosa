
use serde::Serialize;
use std::{ io::{ Error as IOError, ErrorKind }, sync::Arc };
use axum::{ extract::{ Path, Json }, http::StatusCode, response::IntoResponse, Extension };
use serde::Deserialize;
use image::Pixel;
use log::{ info, error };

use super::super::config::Config;
use super::{ publish::publish, unpublish::unpublish, io::interface::ImageInterface, util::parse_coords_from_path };


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
  /// The link of the produced tile.
  link: Option<String>,
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
pub async fn publish_handler<IO: ImageInterface>(
  Extension(config): Extension<Arc<Config>>,
  Extension(io): Extension<Arc<IO>>,
  Path(coords): Path<String>,
  Json(body): Json<PublishBody>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)>
where
  IO: 'static,
  <IO as ImageInterface>::Pixel: 'static,
  <<IO as ImageInterface>::Pixel as Pixel>::Subpixel: Serialize + Send + Sync + 'static {
  match parse_coords_from_path(coords.as_str()) {
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
pub async fn unpublish_handler<IO: ImageInterface>(
  Extension(config): Extension<Arc<Config>>,
  Extension(io): Extension<Arc<IO>>,
  Path(coords): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)>
  where
    IO: 'static,
    <IO as ImageInterface>::Pixel: 'static,
    <<IO as ImageInterface>::Pixel as Pixel>::Subpixel: Send + Sync + 'static {
  match parse_coords_from_path(coords.as_str()){
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
