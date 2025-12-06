use std::borrow::Cow;
use std::str::FromStr;
use std::time::Duration;

use bytesize::ByteSize;
use s3::bucket::Bucket;
use s3::post_policy::{PostPolicy, PostPolicyField as F, PostPolicyValue as V, PresignedPost};
use serde::Deserialize;
use serde_with::DeserializeFromStr;

use super::super::wallet::Transaction;
use super::book::Coords;
use super::error::BiddingError;

///
/// Represents content type filters
/// (per [http semantics spec](https://httpwg.org/specs/rfc9110.html#field.content-type)).
/// Can be a prefix, for example `image/` or an exact match, for example `image/jpeg`.
/// <br><br>
///
/// ```rs
/// let all_images = ContenType::Prefix("image/".to_string());
/// let jpeg = ContentType::Exact("image/jpeg".to_string());
/// ```
/// <br>
///
/// Can also be parsed from a string, in which case the string must be either a valid MIME type
/// or a prefix ending with `"*"`, for example `"image/*"`.
/// <br><br>
///
/// ```rs
/// let all_images = "image/*".parse::<ContentType>().unwrap();
/// let jpeg = "image/jpeg".parse::<ContentType>().unwrap();
/// ```
///
#[derive(Clone, Debug, DeserializeFromStr)]
pub enum ContentType {
  ///
  /// A prefix content type, for example `image/`.
  /// This matches any content type that starts with the prefix, such as `image/jpeg`, `image/png`, etc.
  ///
  Prefix(String),

  ///
  /// An exact content type, for example `image/jpeg`.
  ///
  Exact(String),
}

impl FromStr for ContentType {
  type Err = String;

  ///
  /// Parse a content type from a string. Valid strings are:
  /// - A valid MIME type, for example `image/jpeg`.
  /// - A prefix ending with `"*"`, for example `"image/*"`.
  ///
  fn from_str(s: &str) -> Result<Self, Self::Err> {
    if mime::Mime::from_str(s.trim_end_matches('*')).is_err() {
      return Err(format!("Invalid content type: {s}"));
    }

    match s.split_once('/') {
      Some((prefix, "*")) => Ok(ContentType::Prefix(prefix.to_string() + "/")),
      Some(_) => Ok(ContentType::Exact(s.to_string())),
      None => Err(format!("Invalid content type: {s}")),
    }
  }
}

///
/// Configuration for image upload. Includes the following:
/// - The maximum file size for the uploaded image,
/// - The expiration time for the presigned URL used for upload,
/// - The content type filter for the uploaded image.
///
/// ### Example (TOML):
/// ```toml
/// max_file_size = "5MB"
/// url_expiration = "1h"
/// content_type = "image/jpeg"
/// ```
///
#[derive(Clone, Deserialize, Debug)]
pub struct Config {
  #[serde(with = "bytesize_serde")]
  pub max_file_size: ByteSize,
  #[serde(with = "humantime_serde")]
  pub url_expiration: Duration,
  pub content_type: ContentType,
}

///
/// Generates a presigned URL for uploading an image to given S3 bucket,
/// for given coordinates and transaction.
/// The URL will be valid for the duration specified in the `Config`.
///
/// ### Usage
/// First, you generate the URL and the fields:
/// ```rs
/// let { url, fields } = upload::generate_url(&bucket, coords, &transaction, &config).await?;
///```
/// Somehow pass these to the client, which then can use them to upload the image:
/// ```js
/// const formData = new FormData()
/// for (key, value) of Object.entries(fields) {
///   formData.append(key, value)
/// }
/// formData.append('file', file) // where `file` is a File object, or a Blob
/// await fetch(url, {
///   method: 'POST',
///   body: formData
/// })
/// ```
///
pub async fn generate_url(
  bucket: &Bucket,
  coords: Coords,
  transaction: &Transaction,
  config: &Config,
) -> Result<PresignedPost, BiddingError> {
  let Some(txid) = transaction.id else {
    return Err(BiddingError::IncorrectTransaction);
  };

  let key = format!("tile-{}-{}-{}.jpg", coords.x, coords.y, txid);

  let policy = PostPolicy::new(u32::try_from(config.url_expiration.as_secs()).unwrap_or_default())
    .condition(F::Key, V::Exact(Cow::from(key)))
    .unwrap()
    .condition(
      F::ContentLengthRange,
      V::Range(
        1,
        u32::try_from(config.max_file_size.as_u64()).unwrap_or_default(),
      ),
    )
    .unwrap()
    .condition(
      F::ContentType,
      match &config.content_type {
        ContentType::Exact(content_type) => V::Exact(Cow::from(content_type)),
        ContentType::Prefix(content_type) => V::StartsWith(Cow::from(content_type)),
      },
    )
    .unwrap();

  bucket
    .presign_post(policy)
    .await
    .map_err(|_| BiddingError::Unknown)
}
