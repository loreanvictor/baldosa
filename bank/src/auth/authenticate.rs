use std::sync::Arc;

use axum::{
  extract::{Extension, Json},
  response::IntoResponse,
};
use log::error;
use serde::Deserialize;
use tower_sessions::Session;
use webauthn_rs::prelude::*;

use super::error::AuthError;
use super::storage::AuthStorage;
use super::user::{AuthenticatedUser, VerificationStatus};

pub async fn start(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  session: Session,
) -> Result<impl IntoResponse, AuthError> {
  match webauthn.start_discoverable_authentication() {
    Ok((credential_options, reg_state)) => {
      session.insert("auth_state", reg_state).await?;
      Ok(Json(credential_options))
    }
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
  let Some(reg_state) = session
    .get::<DiscoverableAuthentication>("auth_state")
    .await?
  else {
    return Err(AuthError::CorruptSession);
  };

  let Ok((uuid, cred_id)) = webauthn.identify_discoverable_authentication(&body.credential) 
  else {
    return Err(AuthError::InvalidCredentials);
  };

  let Ok(passkeys) = storage.get_passkeys(uuid).await
  else {
    return Err(AuthError::UserNotFound);
  };

  let Some(passkey) = passkeys.iter().find(|key| key.credential_id == cred_id)
  else {
    return Err(AuthError::InvalidCredentials);
  };

  let discoverable_keys = passkeys
    .iter()
    .map(|key| DiscoverableKey::from(&key.passkey_data))
    .collect::<Vec<_>>();
  match webauthn.finish_discoverable_authentication(
    &body.credential,
    reg_state,
    discoverable_keys.as_ref(),
  ) {
    Ok(auth_result) => {
      // TODO: also something about checking the counter should be done here?
      if auth_result.needs_update() {
        let mut passkey = passkey.passkey_data.clone();
        passkey.update_credential(&auth_result);
        let _ = storage.update_passkey(uuid, &passkey).await;
      }

      match storage.find_user_by_id(uuid).await {
        Ok(Some(user)) => {
          let verification = VerificationStatus::from(&user);
          Ok(Json(AuthenticatedUser::sign(
            user.id,
            user.email,
            user.first_name,
            user.last_name,
            verification,
          )))
        }
        Ok(None) => {
          error!("User not found: {uuid}");
          Err(AuthError::UserNotFound)
        }
        Err(err) => {
          error!("Error finding user: {err:?}");
          Err(AuthError::Unknown)
        }
      }
    }
    Err(_) => {
      Err(AuthError::InvalidCredentials)
    }
  }
}
