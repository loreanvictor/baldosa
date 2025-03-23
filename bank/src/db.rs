use std::env;
use sqlx::{ Pool, Postgres, postgres::PgPoolOptions };


pub async fn init() -> Pool<Postgres> {
  PgPoolOptions::new()
    .connect(
        env::var("DATABASE_URL")
        .expect("Database URL must be specified")
        .as_str()
      )
      .await
      .unwrap()
}
