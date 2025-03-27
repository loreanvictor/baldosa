use rand::{rngs::StdRng, Rng, SeedableRng};
use webauthn_rs::prelude::Uuid;
use chrono::{ DateTime, Utc };
use serde::{ Serialize, Deserialize };
use sqlx::{ postgres::Postgres, Pool };


#[derive(Serialize, Deserialize, Debug)]
pub struct OneTimeCode {
  pub id: Uuid,
  pub user_id: Uuid,
  pub code: String,
  pub subject: String,
  pub created_at: DateTime<Utc>,
  pub expires_at: DateTime<Utc>,
}


#[derive(Debug, Clone)]
pub struct OneTimeCodes {
  pool: Pool<Postgres>
}

impl OneTimeCodes {
  pub fn new(pool: Pool<Postgres>) -> Self {
    Self { pool }
  }

  pub async fn create(&self, user_id: &Uuid, subject: &str) -> Result<OneTimeCode, sqlx::Error> {
    let mut rng = StdRng::from_os_rng();
    let code = format!("{:06}", rng.random_range(0..1_000_000));

    match sqlx::query_as!(
      OneTimeCode,
      "insert into one_time_codes (user_id, code, subject, expires_at)
      values ($1, $2, $3, now() + interval '15 minutes')
      returning id, user_id, code, subject, created_at, expires_at",
      user_id, code, subject
    ).fetch_one(&self.pool).await {
      Ok(code) => Ok(code),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn consume(&self, user_id: &Uuid, code: &str, subject: &str) -> Result<(), sqlx::Error> {
    let code = match sqlx::query_as!(
      OneTimeCode,
      "select * from one_time_codes where user_id = $1 and code = $2 and subject = $3 and expires_at > now()",
      user_id, code, subject
    ).fetch_one(&self.pool).await {
      Ok(code) => code,
      Err(error) => { return Err(error); },
    };

    match sqlx::query!(
      "delete from one_time_codes where id = $1",
      code.id
    ).execute(&self.pool).await {
      Ok(_) => Ok(()),
      Err(e) => Err(e).into(),
    }
  }
}
