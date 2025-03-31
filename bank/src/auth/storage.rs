use webauthn_rs::prelude::*;
use chrono::{ DateTime, Utc };
use serde::{ Serialize, Deserialize };
use sqlx::{ postgres::Postgres, Error, Pool };


#[derive(Serialize, Deserialize, Debug)]
pub struct StoredUser {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub email_verified_at: Option<DateTime<Utc>>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct StoredPasskey {
  pub id: Uuid,
  pub user_id: Uuid,
  pub key_name: String,
  pub credential_id: Vec<u8>,
  pub passkey_data: Passkey,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
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
  ) -> Result<StoredPasskey, sqlx::Error> {
    let cred_id = passkey.cred_id().as_ref();
    let passkey_json = serde_json::json!(passkey);
    match sqlx::query!(
      "insert into passkeys (user_id, key_name, credential_id, passkey_data)
      values ($1, $2, $3, $4)
      returning id, created_at, updated_at",
      &user_id, &key_name, &cred_id, &passkey_json
    ).fetch_optional(&self.pool).await {
      Ok(record) => match record {
        Some(record) => Ok(StoredPasskey {
          id: record.id,
          user_id,
          key_name: key_name.to_string(),
          credential_id: cred_id.to_vec(),
          passkey_data: passkey.clone(),
          created_at: record.created_at,
          updated_at: record.updated_at,
        }),
        None => Err(Error::RowNotFound)
      }
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
      "update passkeys set passkey_data = $2, updated_at = now()
        where user_id = $3 and credential_id = $1",
      cred_id, passkey_json, user_id
    ).execute(&self.pool).await {
      Ok(_) => Ok(()),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn get_passkeys(&self, user_id: Uuid) -> Result<Vec<StoredPasskey>, sqlx::Error> {
    let res = sqlx::query!(
      "select * from passkeys where user_id = $1", user_id).fetch_all(&self.pool).await;
    match res {
      Ok(records) => Ok(
        records.iter()
          .map(|record| StoredPasskey {
            id: record.id,
            user_id: record.user_id,
            key_name: record.key_name.clone(),
            credential_id: record.credential_id.clone(),
            passkey_data: serde_json::from_value::<Passkey>(record.passkey_data.clone()).unwrap(),
            created_at: record.created_at,
            updated_at: record.updated_at,
          })
          .collect()
      ),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn remove_passkey(&self, user_id: Uuid, id: Uuid) -> Result<(), sqlx::Error> {
    match sqlx::query!(
      "delete from passkeys where user_id = $1 and id = $2",
      user_id, id
    ).execute(&self.pool).await {
      Ok(_) => Ok(()),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn find_user_by_email(&self, email: &str) -> Result<Option<StoredUser>, sqlx::Error> {
    let res = sqlx::query_as!(
      StoredUser,
      "select * from users where email = $1",
      email
    ).fetch_optional(&self.pool).await;
    match res {
      Ok(user) => Ok(user),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn find_user_by_id(&self, id: Uuid) -> Result<Option<StoredUser>, sqlx::Error> {
    let res = sqlx::query_as!(
      StoredUser,
      "select * from users where id = $1",
      id
    ).fetch_optional(&self.pool).await;
    match res {
      Ok(user) => Ok(user),
      Err(e) => Err(e).into(),
    }
  }

  pub async fn verify_user_email(&self, id: Uuid) -> Result<Option<StoredUser>, sqlx::Error> {
    let res = sqlx::query_as!(
      StoredUser,
      "update users set email_verified_at = now() where id = $1 returning *",
      id
    ).fetch_optional(&self.pool).await;
    match res {
      Ok(user) => Ok(user),
      Err(e) => Err(e).into(),
    }
  }
}
