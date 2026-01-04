use std::env;

use aws_sdk_s3::Client as S3Client;
use url::Url;

pub mod error;
pub mod interface;
pub mod meta;

mod fs_jpeg;
mod fs_png;
mod s3_jpeg;

#[allow(unused_imports)]
pub use fs_jpeg::FsJpegInterface;
#[allow(unused_imports)]
pub use fs_png::FsPngInterface;
use interface::ImageInterface;
#[allow(unused_imports)]
pub use s3_jpeg::S3JpegInterface;

pub type DefaultImageInterface = S3JpegInterface;

pub fn init(s3: S3Client) -> (impl ImageInterface, impl ImageInterface) {
  (
    S3JpegInterface::new(
      s3.clone(),
      env::var("S3_SUBMIT_BUCKET").expect("S3 not configured properly: missing S3_SUBMIT_BUCKET"),
      env::var("S3_PUBLISH_BUCKET").expect("S3 not configured properly: missing S3_PUBLISH_BUCKET"),
      env::var("S3_PUBLISH_URL_BASE")
        .ok()
        .and_then(|url| Url::parse(&url).ok()),
    ),
    S3JpegInterface::new(
      s3,
      env::var("S3_PUBLISH_BUCKET").expect("S3 not configured properly: missing S3_PUBLISH_BUCKET"),
      env::var("S3_PUBLISH_BUCKET").expect("S3 not configured properly: missing S3_PUBLISH_BUCKET"),
      env::var("S3_PUBLISH_URL_BASE")
        .ok()
        .and_then(|url| Url::parse(&url).ok()),
    ),
  )
}
