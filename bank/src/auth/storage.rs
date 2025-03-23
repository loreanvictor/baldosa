use webauthn_rs::prelude::*;
use serde::{ Serialize, Deserialize };
use sqlx::{ Pool, postgres::Postgres };


#[derive(Serialize, Deserialize, Debug)]
pub struct User {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
}


#[derive(Debug, Clone)]
pub struct AuthStorage {
  pool: Pool<Postgres>
}

impl AuthStorage {
  pub fn new(pool: Pool<Postgres>) -> Self {
    Self { pool }
  }

  pub async fn create_user(&self,
    id: Uuid,
    email: &str,
    first_name: &str,
    last_name: &str,
  ) -> Result<(), sqlx::Error> {
    match sqlx::query!(
      "insert into users (id, email, first_name, last_name)
      values ($1, $2, $3, $4)",
      id, email, first_name, last_name
    ).execute(&self.pool).await {
      Ok(_) => Ok(()),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn create_passkey(&self,
    user_id: Uuid,
    key_name: &str,
    passkey: &Passkey,
  ) -> Result<(), sqlx::Error> {
    let cred_id = passkey.cred_id().as_ref();
    let passkey_json = serde_json::json!(passkey);
    match sqlx::query!(
      "insert into passkeys (user_id, key_name, credential_id, passkey_data)
      values ($1, $2, $3, $4)",
      user_id, key_name, cred_id, passkey_json
    ).execute(&self.pool).await {
      Ok(_) => Ok(()),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn update_passkey(&self,
    user_id: Uuid,
    passkey: &Passkey
  ) -> Result<(), sqlx::Error> {
    let cred_id = passkey.cred_id().as_ref();
    let passkey_json = serde_json::json!(passkey);
    match sqlx::query!(
      "update passkeys set credential_id = $1, passkey_data = $2 where user_id = $3",
      cred_id, passkey_json, user_id
    ).execute(&self.pool).await {
      Ok(_) => Ok(()),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn get_passkeys(&self, user_id: Uuid) -> Result<Vec<Passkey>, sqlx::Error> {
    let res = sqlx::query!(
      "select passkey_data from passkeys where user_id = $1", user_id).fetch_all(&self.pool).await;
    match res {
      Ok(records) => Ok(
        records.iter()
          .map(|record| serde_json::from_value::<Passkey>(record.passkey_data.clone()).unwrap())
          .collect()
      ),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn find_user_by_email(&self, email: &str) -> Result<Option<User>, sqlx::Error> {
    let res = sqlx::query_as!(
      User,
      "select id, email, first_name, last_name from users where email = $1",
      email
    ).fetch_optional(&self.pool).await;
    match res {
      Ok(user) => Ok(user),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn find_user_by_id(&self, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    let res = sqlx::query_as!(
      User,
      "select id, email, first_name, last_name from users where id = $1",
      id
    ).fetch_optional(&self.pool).await;
    match res {
      Ok(user) => Ok(user),
      Err(e) => Err(e).into(),
    }
  }
}
