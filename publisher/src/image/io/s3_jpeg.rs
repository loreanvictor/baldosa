use url::Url;
use async_trait::async_trait;
use std::{ env, error::Error, io::Cursor, io::Error as IOError, io::ErrorKind };
use aws_sdk_s3::Client as S3Client;
use image::{ Rgb, RgbImage, ImageReader, ImageFormat::Jpeg };

use super::interface::{ ImageInterface, Metadata };


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
    source_bucket: Option<String>,
    target_bucket: Option<String>,
  ) -> Self {
    let region = String::from(client.config().region().unwrap().as_ref());
    let target_bucket = target_bucket
      .unwrap_or_else(
        || env::var("S3_TARGET_BUCKET")
          .expect("Target bucket not specified for S3 JPEG interface.")
      );
    Self {
      client,
      source_bucket: source_bucket
        .unwrap_or_else(
          || env::var("S3_SOURCE_BUCKET")
            .expect("Source bucket not specified for S3 JPEG interface.")
        ),
      target_bucket: String::from(&target_bucket),
      target_url: Url::parse(
          &env::var("S3_TARGET_URL_BASE")
            .unwrap_or_else(|_| format!("https://{}.s3.{}.amazonaws.com/", &target_bucket, region))
        ).unwrap(),
    }
  }
}


#[async_trait]
impl ImageInterface for S3JpegInterface {
  type Pixel = Rgb<u8>;
  async fn load(&self, source: &str) -> Result<RgbImage, Box<dyn Error + Send + Sync>> {
    match self.client.get_object()
      .bucket(&self.source_bucket)
      .key(source)
      .send()
      .await {
      Ok(response) => {
        let body = response.body.collect().await?.into_bytes();
        let cursor = Cursor::new(body);

        match ImageReader::new(cursor).with_guessed_format() {
          Ok(decodable) if decodable.format().is_some() => Ok(decodable.decode()?.into_rgb8()),
          _ => Err(Box::new(IOError::new(ErrorKind::InvalidInput, "Invalid file format"))),
        }
      },
      Err(err) if err.raw_response().unwrap().status().as_u16() == 404 => {
        Err(Box::new(IOError::new(ErrorKind::NotFound, err.to_string())))
      },
      Err(err) => Err(Box::new(err)),
    }
  }

  // TODO: improve error handling here
  async fn save(
    &self,
    image: &RgbImage,
    meta: &Metadata,
    target: &str
  ) -> Result<String, Box<dyn Error + Send + Sync>> {
    let key = String::from(target) + ".jpg";

    let mut buffer = Vec::new();
    image.write_to(&mut Cursor::new(&mut buffer), Jpeg)?;

    self.client.put_object()
      .bucket(&self.target_bucket)
      .key(&key)
      .body(buffer.to_vec().into())
      .metadata("title", &meta.title)
      .metadata("subtitle", &meta.subtitle)
      .metadata("link", &meta.link)
      .send()
      .await?;

    let mut target = self.target_url.clone();
    target.path_segments_mut().unwrap().push(&key);
    Ok(target.to_string())
  }

  async fn delete(&self, target: &str) -> Result<String, Box<dyn Error + Send + Sync>> {
    let key = String::from(target) + ".jpg";

    match self.client.delete_object()
      .bucket(&self.target_bucket)
      .key(&key)
      .send()
      .await {
      Ok(_) => {
        let mut target = self.target_url.clone();
        target.path_segments_mut().unwrap().push(&key);
        Ok(target.to_string())
      },
      Err(err) => Err(Box::new(err)),
    }
  }
}
