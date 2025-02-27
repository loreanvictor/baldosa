use std::env;
use sqlx::{ Pool, Sqlite, sqlite::SqlitePoolOptions };


pub async fn init() -> Pool<Sqlite> {
  SqlitePoolOptions::new()
    .connect(
        env::var("DATABASE_URL")
        .expect("Database URL must be specified")
        .as_str()
      )
      .await
      .unwrap()
}
