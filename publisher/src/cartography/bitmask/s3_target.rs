use async_trait::async_trait;
use std::error::Error;
use aws_sdk_s3::Client as S3Client;

use super::super::Coords;
use super::target::BitmaskTarget;


///
/// A target to store chunk bitmasks of a map in an S3 bucket.
/// A chunk bitmask is a bitmask representing a finite chunk of an infinite map,
/// and can be used to quickly determine if a point exists within the chunk
/// (i.e. if a tile is published or not).
/// 
/// The S3 target stores the bitmask for a chunk (x, y) in the bucket as a binary file
/// named `tilemap-x-y.bin`.
///
pub struct S3BitmaskTarget {
  client: S3Client,
  bucket: String,
}

impl S3BitmaskTarget {
  ///
  /// Create a new S3 bitmask target with the given S3 client and target bucket.
  /// - `client` - the S3 client to use to store the bitmasks.
  /// - `bucket` - the target bucket to store the bitmasks in. If not specified, the
  ///  `S3_TARGET_BUCKET` environment variable is used.
  ///
  pub fn new(client: S3Client, bucket: String) -> Self {
    Self { client, bucket }
  }
}

#[async_trait]
impl BitmaskTarget for S3BitmaskTarget {
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
