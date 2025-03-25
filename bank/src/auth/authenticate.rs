use std::sync::Arc;
use serde::Deserialize;
use webauthn_rs::prelude::*;
use tower_sessions::Session;
use axum::{ extract::{ Extension, Json }, response::IntoResponse };

use log::error;

use super::error::AuthError;
use super::storage::AuthStorage;
use super::user::AuthenticatedUser;


pub async fn start(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  session: Session,
) -> Result<impl IntoResponse, AuthError> {
  match webauthn.start_discoverable_authentication() {
    Ok((credential_options, reg_state)) => {
      session.insert("auth_state", reg_state).await?;
      Ok(Json(credential_options))
    },
    Err(_) => Err(AuthError::Unknown),
  }
}


#[derive(Deserialize, Debug)]
pub struct AuthenticateWithPasskeyBody {
  pub credential: PublicKeyCredential,
}

pub async fn finish(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  Json(body): Json<AuthenticateWithPasskeyBody>,
) -> Result<impl IntoResponse, AuthError> {
  let reg_state = match session.get::<DiscoverableAuthentication>("auth_state").await? {
    Some(state) => state,
    None => { return Err(AuthError::CorruptSession); },
  };

  let (uuid, cred_id) = match webauthn.identify_discoverable_authentication(&body.credential) {
    Ok((uuid, cred_id)) => (uuid, cred_id),
    Err(_) => { return Err(AuthError::InvalidCredentials); },
  };

  let passkeys = match storage.get_passkeys(uuid).await {
    Ok(passkeys) => passkeys,
    Err(_) => { return Err(AuthError::UserNotFound); },
  };

  let passkey = match passkeys.iter().find(|key| key.credential_id == cred_id) {
    Some(passkey) => passkey,
    None => { return Err(AuthError::InvalidCredentials); },
  };

  let discoverable_keys = passkeys.iter().map(|key| DiscoverableKey::from(&key.passkey_data)).collect::<Vec<_>>();
  match webauthn.finish_discoverable_authentication(&body.credential, reg_state, discoverable_keys.as_ref()) {
    Ok(auth_result) => {
      // TODO: also something about checking the counter should be done here?
      if auth_result.needs_update() {
        let mut passkey = passkey.passkey_data.clone();
        passkey.update_credential(&auth_result);
        let _ = storage.update_passkey(uuid, &passkey).await;
      }

      match storage.find_user_by_id(uuid).await {
        Ok(Some(user)) => Ok(Json(AuthenticatedUser::sign(user.id, user.email, user.first_name, user.last_name ))),
        Ok(None) => {
          error!("User not found: {}", uuid);
          Err(AuthError::UserNotFound)
        },
        Err(err) => {
          error!("Error finding user: {:?}", err);
          Err(AuthError::Unknown)
        },
      }
    },
    Err(_) => { return Err(AuthError::InvalidCredentials); },
  }
}
