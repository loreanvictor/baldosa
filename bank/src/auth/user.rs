use webauthn_rs::prelude::Uuid;
use serde::Serialize;


#[derive(Serialize, Debug)]
pub struct AuthenticatedUser {
  pub id: Uuid,
  pub email: String,
  pub first_name: String,
  pub last_name: String,
  pub token: String,
}


impl AuthenticatedUser {
  pub fn sign(
    id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
  ) -> Self {
    Self {
      id,
      email,
      first_name,
      last_name,
      token: "TODO: generate jwt token".to_string(),
    }
  }
}
