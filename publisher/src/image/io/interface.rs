use async_trait::async_trait;
use image::{ImageBuffer, Pixel};

use super::error::ImageIoError;
use super::meta::Metadata;

///
/// An interface for loading and saving images.
///
#[async_trait]
pub trait ImageInterface: Sync + Send + Clone {
  ///
  /// The pixel type used by the image. Different interfaces may work with
  /// different pixel types, for example RGB8, RGBA8, etc.
  ///
  type Pixel: Pixel + Send + Sync;

  ///
  /// Load an image from the given source.
  /// The `source` might denote different things based on the interface,
  /// for example it might be some fs path, or some URL, etc.
  ///
  async fn load(
    &self,
    source: &str,
  ) -> Result<
    (
      ImageBuffer<Self::Pixel, Vec<<Self::Pixel as Pixel>::Subpixel>>,
      Option<Metadata>,
    ),
    ImageIoError,
  >;

  ///
  /// Save an image to the given target.
  /// The `target` might denote different things based on the interface,
  /// for example it might be some fs path, or some URL, etc.
  ///
  async fn save(
    &self,
    image: &ImageBuffer<Self::Pixel, Vec<<Self::Pixel as Pixel>::Subpixel>>,
    meta: &Metadata,
    target: &str,
  ) -> Result<String, ImageIoError>;

  ///
  /// Delete an image from the given target.
  /// The `target` might denote different things based on the interface,
  /// for example it might be some fs path, or some URL, etc.
  ///
  async fn delete(&self, target: &str) -> Result<String, ImageIoError>;
}
