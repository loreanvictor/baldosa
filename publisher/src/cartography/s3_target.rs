use async_trait::async_trait;
use std::{ env, error::Error };
use aws_sdk_s3::Client as S3Client;

use super::Coords;
use super::target::MapTarget;


pub struct S3MapTarget {
  client: S3Client,
  bucket: String,
}

impl S3MapTarget {
  pub fn new(client: S3Client, bucket: Option<String>) -> Self {
    let bucket = bucket
      .unwrap_or_else(
        || env::var("S3_TARGET_BUCKET")
        .expect("Target bucket not specified for S3 map target.")
    );

    Self { client, bucket }
  }
}

#[async_trait]
impl MapTarget for S3MapTarget {
  async fn save_bitmask(&self, anchor: &Coords, bitmask: &[u8]) -> Result<(), Box<dyn Error + Send + Sync>> {
    let key = format!("tilemap-{}-{}.bin", anchor.0, anchor.1);
    match self.client
      .put_object()
      .bucket(&self.bucket)
      .key(key)
      .body(bitmask.to_vec().into())
      .send()
      .await {
      Ok(_) => Ok(()),
      Err(e) => Err(e.into())
    }
  }
}
