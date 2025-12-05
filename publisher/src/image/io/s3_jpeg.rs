use std::io::Cursor;

use async_trait::async_trait;
use aws_sdk_s3::Client as S3Client;
use image::{ImageFormat::Jpeg, ImageReader, Rgb, RgbImage};
use url::Url;

use super::{error::ImageIoError, interface::ImageInterface, meta::Metadata};

pub struct S3JpegInterface {
  client: S3Client,
  source_bucket: String,
  target_bucket: String,
  target_url: Url,
}

impl S3JpegInterface {
  #[allow(dead_code)]
  pub fn new(
    client: S3Client,
    source_bucket: String,
    target_bucket: String,
    target_url: Option<Url>,
  ) -> Self {
    let region = String::from(client.config().region().unwrap().as_ref());

    Self {
      client,
      target_url: target_url.unwrap_or(
        Url::parse(format!("https://{}.s3.{}.amazonaws.com/", &target_bucket, region).as_str())
          .unwrap(),
      ),
      source_bucket,
      target_bucket,
    }
  }
}

#[async_trait]
impl ImageInterface for S3JpegInterface {
  type Pixel = Rgb<u8>;
  async fn load(&self, source: &str) -> Result<RgbImage, ImageIoError> {
    let response = self
      .client
      .get_object()
      .bucket(&self.source_bucket)
      .key(source)
      .send()
      .await
      .map_err(|err| {
        if err.raw_response().unwrap().status().as_u16() == 404 {
          ImageIoError::NotFound
        } else {
          ImageIoError::ReadError(Box::new(err))
        }
      })?;

    let body = response
      .body
      .collect()
      .await
      .map_err(|err| ImageIoError::ReadError(Box::new(err)))?
      .into_bytes();
    let cursor = Cursor::new(body);

    let decodable = ImageReader::new(cursor)
      .with_guessed_format()
      .map_err(|_| ImageIoError::InvalidFormat)?;
    if decodable.format().is_none() {
      return Err(ImageIoError::InvalidFormat);
    }
    Ok(
      decodable
        .decode()
        .map_err(|err| ImageIoError::ReadError(Box::new(err)))?
        .into_rgb8(),
    )
  }

  async fn save(
    &self,
    image: &RgbImage,
    meta: &Metadata,
    target: &str,
  ) -> Result<String, ImageIoError> {
    let key = format!("{}.jpg", target);

    let mut buffer = Vec::new();
    image
      .write_to(&mut Cursor::new(&mut buffer), Jpeg)
      .map_err(|err| ImageIoError::WriteError(Box::new(err)))?;

    self
      .client
      .put_object()
      .bucket(&self.target_bucket)
      .key(&key)
      .cache_control("max-age=600")
      .set_metadata(
        meta
          .to_hashmap()
          .map_err(|err| ImageIoError::InvalidMetadata(err))?,
      )
      .body(buffer.to_vec().into())
      .send()
      .await
      .map_err(|err| ImageIoError::WriteError(Box::new(err)))?;

    let mut target = self.target_url.clone();
    target.path_segments_mut().unwrap().push(&key);
    Ok(target.to_string())
  }

  async fn delete(&self, target: &str) -> Result<String, ImageIoError> {
    let key = format!("{}.jpg", target);

    self
      .client
      .delete_object()
      .bucket(&self.target_bucket)
      .key(&key)
      .send()
      .await
      .map_err(|err| ImageIoError::DeleteError(Box::new(err)))?;

    let mut target = self.target_url.clone();
    target.path_segments_mut().unwrap().push(&key);
    Ok(target.to_string())
  }
}
