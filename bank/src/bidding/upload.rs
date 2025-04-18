use std::borrow::Cow;
use std::env;

use s3::bucket::Bucket;
use s3::post_policy::{PostPolicyField as F, PostPolicyValue as V, PostPolicy, PresignedPost};

use super::super::wallet::Transaction;
use super::error::BiddingError;
use super::util::{parse_file_size, parse_time_duration};

#[derive(Clone)]
pub enum ContentType {
  Prefix(String),
  Exact(String),
}

#[derive(Clone)]
pub struct Config {
  pub max_file_size: u32,
  pub url_expiration: u32,
  pub content_type: ContentType,
}

impl Config {
  pub fn image_config_from_env() -> Self {
    Self {
      max_file_size: parse_file_size(
        &env::var("UPLOAD_IMAGE_MAX_FILE_SIZE").unwrap_or("5MB".to_string()),
      )
      .unwrap(),
      url_expiration: parse_time_duration(
        &env::var("UPLOAD_IMAGE_URL_EXPIRATION").unwrap_or("30min".to_string()),
      )
      .unwrap(),
      content_type: match env::var("UPLOAD_IMAGE_CONTENT_TYPE") {
        Ok(content_type) => ContentType::Exact("image/".to_string() + content_type.as_str()),
        Err(_) => ContentType::Prefix("image/".to_string()),
      },
    }
  }
}

pub async fn generate_url(
  bucket: &Bucket,
  coords: (i32, i32),
  transaction: &Transaction,
  config: &Config,
) -> Result<PresignedPost, BiddingError> {
  let Some(txid) = transaction.id else {
    return Err(BiddingError::InvalidBid)
  };

  let key = format!("tile-{}-{}-{}.jpg", coords.0, coords.1, txid);

  let policy = PostPolicy::new(config.url_expiration)
    .condition(F::Key, V::Exact(Cow::from(key)))
    .unwrap()
    .condition(F::ContentLengthRange, V::Range(1, config.max_file_size))
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
