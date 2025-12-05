use std::{env, io::Cursor, path::Path};

use async_trait::async_trait;
use image::{load_from_memory, ImageFormat::Jpeg, Rgb, RgbImage};
use log::warn;
use tokio::{
  fs::{read, remove_file, File},
  io::AsyncWriteExt,
};

use super::error::ImageIoError;
use super::interface::ImageInterface;
use super::meta::Metadata;

pub struct FsJpegInterface {
  source_dir: String,
  target_dir: String,
}

impl FsJpegInterface {
  #[allow(dead_code)]
  pub fn new(source_dir: Option<String>, target_dir: Option<String>) -> Self {
    Self {
      source_dir: source_dir.unwrap_or_else(|| {
        env::var("SOURCE_DIR").expect("Source directory not specified for FS JPEG interface.")
      }),
      target_dir: target_dir.unwrap_or_else(|| {
        env::var("TARGET_DIR").expect("Target directory not specified for FS JPEG interface.")
      }),
    }
  }
}

#[async_trait]
impl ImageInterface for FsJpegInterface {
  type Pixel = Rgb<u8>;

  async fn load(&self, source: &str) -> Result<RgbImage, ImageIoError> {
    let path = Path::new(&self.source_dir).join(source);
    let file = read(path).await.map_err(|err| match err.kind() {
      std::io::ErrorKind::NotFound => ImageIoError::NotFound,
      _ => ImageIoError::ReadError(Box::new(err)),
    })?;
    let img = load_from_memory(&file).map_err(|err| ImageIoError::ReadError(Box::new(err)))?;
    let rgb = img.into_rgb8();

    Ok(rgb)
  }

  async fn save(
    &self,
    image: &RgbImage,
    _meta: &Metadata,
    target: &str,
  ) -> Result<String, ImageIoError> {
    let path = Path::new(&self.target_dir)
      .join(target)
      .with_extension("jpg");
    let mut target = File::create(&path)
      .await
      .map_err(|err| ImageIoError::WriteError(Box::new(err)))?;
    let mut buffer = Vec::new();
    image
      .write_to(&mut Cursor::new(&mut buffer), Jpeg)
      .map_err(|err| ImageIoError::WriteError(Box::new(err)))?;
    target
      .write_all(&buffer)
      .await
      .map_err(|err| ImageIoError::WriteError(Box::new(err)))?;

    warn!("Metadata not supported, skipped for {}", &path.display());

    Ok(path.display().to_string())
  }

  async fn delete(&self, source: &str) -> Result<String, ImageIoError> {
    let path = Path::new(&self.target_dir)
      .join(source)
      .with_extension("jpg");
    remove_file(&path)
      .await
      .map_err(|err| ImageIoError::DeleteError(Box::new(err)))?;

    Ok(path.display().to_string())
  }
}
