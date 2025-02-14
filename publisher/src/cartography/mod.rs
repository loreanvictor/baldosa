use std::sync::Arc;
use tokio::time::Duration;
use aws_sdk_s3::Client as S3Client;
use sqlx::{ Pool, Sqlite };
use image::Rgb;

use storage::sqlite::SqliteMapStorage;
use s3_target::S3MapTarget;
use schedule::Throttler;
use cartographer::Cartographer;

pub mod storage;
pub mod schedule;
pub mod cartographer;
pub mod target;
pub mod s3_target;
pub use storage::{ Storage, Coords, Point };


pub type DefaultMapStorage = Cartographer<Rgb<u8>>;

pub fn init(db: Pool<Sqlite>, s3: S3Client) -> impl Storage<Rgb<u8>> {
  let sqlite = SqliteMapStorage::new(db);
  let target = S3MapTarget::new(s3, None);

  cartographer::Cartographer::new(
    Arc::new(sqlite),
    Arc::new(target),
    Throttler::new(Duration::from_millis(3000)),
  )
}
