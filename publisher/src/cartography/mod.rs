use std::{env, sync::Arc};

use aws_sdk_s3::Client as S3Client;
use bitmask::s3_target::S3BitmaskTarget;
use cartographer::Cartographer;
use image::Rgb;
use schedule::Throttler;
use sqlx::{Pool, Sqlite};
use storage::sqlite::SqliteMapStorage;
use tokio::time::Duration;

pub mod bitmask;
pub mod cartographer;
pub mod schedule;
pub mod storage;
pub use storage::{Coords, Point, Storage};

pub type DefaultMapStorage = Cartographer<Rgb<u8>>;

pub fn init(db: Pool<Sqlite>, s3: S3Client) -> impl Storage<Rgb<u8>> {
  let sqlite = SqliteMapStorage::new(db);
  let target = S3BitmaskTarget::new(
    s3,
    env::var("S3_PUBLISH_BUCKET").expect("S3 not configured properly: missing S3_SUBMIT_BUCKET"),
  );

  cartographer::Cartographer::new(
    Arc::new(sqlite),
    Arc::new(target),
    Throttler::new(Duration::from_millis(3000)),
  )
}
