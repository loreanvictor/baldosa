use std::borrow::Cow;
use std::str::FromStr;
use std::time::Duration;

use bytesize::ByteSize;
use s3::bucket::Bucket;
use s3::post_policy::{PostPolicy, PostPolicyField as F, PostPolicyValue as V, PresignedPost};
use serde::Deserialize;
use serde_with::DeserializeFromStr;

use super::super::wallet::Transaction;
use super::coords::Coords;
use super::error::BiddingError;

#[derive(Clone, Debug, DeserializeFromStr)]
pub enum ContentType {
  Prefix(String),
  Exact(String),
}

impl FromStr for ContentType {
  type Err = String;

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

#[derive(Clone, Deserialize, Debug)]
pub struct Config {
  #[serde(with = "bytesize_serde")]
  pub max_file_size: ByteSize,
  #[serde(with = "humantime_serde")]
  pub url_expiration: Duration,
  pub content_type: ContentType,
}

pub async fn generate_url(
  bucket: &Bucket,
  coords: Coords,
  transaction: &Transaction,
  config: &Config,
) -> Result<PresignedPost, BiddingError> {
  let Some(txid) = transaction.id else {
    return Err(BiddingError::InvalidBid);
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
