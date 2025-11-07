use std::env;

use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

pub async fn init() -> Pool<Sqlite> {
  SqlitePoolOptions::new()
    .connect(
      env::var("DATABASE_URL")
        .expect("Database URL must be specified")
        .as_str(),
    )
    .await
    .unwrap()
}
