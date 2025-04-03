use std::sync::Arc;

use axum::{
  extract::{Extension, Json, Path},
  http::StatusCode,
  response::IntoResponse,
};
use log::{error, info};
use serde::Deserialize;
use tower_sessions::Session;
use webauthn_rs::prelude::*;

use super::storage::AuthStorage;
use super::{AuthError, AuthenticatedUser};

// TODO: break into a separate module
//       with its dedicated router that is
//       nested on the top router.

pub async fn all(
  Extension(storage): Extension<AuthStorage>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, AuthError> {
  let passkeys = match storage.get_passkeys(user.id).await {
    Ok(passkeys) => {
      if passkeys.len() == 0 {
        return Err(AuthError::UserNotFound);
      }
      passkeys
    }
    Err(_) => {
      return Err(AuthError::UserNotFound);
    }
  };

  Ok(Json(passkeys))
}

pub async fn start_adding(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, AuthError> {
  info!("Adding passkey for {}", user.email);

  let name = format!("{} {}", user.first_name, user.last_name);
  let _ = session.remove_value("add_passkey_state").await;

  let existing: Vec<CredentialID> = storage
    .get_passkeys(user.id)
    .await
    .unwrap_or(vec![])
    .iter()
    .map(|passkey| CredentialID::from(passkey.credential_id.clone()))
    .collect();

  match webauthn.start_passkey_registration(user.id, &user.email, &name, Some(existing)) {
    Ok((credential_options, state)) => {
      session.insert("add_passkey_state", &state).await?;
      Ok(Json(credential_options))
    }
    Err(err) => {
      error!(
        "Couldn't initiate adding passkey for {}: {:?}",
        user.email, err
      );
      Err(AuthError::Unknown)
    }
  }
}

#[derive(Deserialize, Debug)]
pub struct AddPasskeyBody {
  pub credential: RegisterPublicKeyCredential,
  pub key_name: String,
}

pub async fn finish_adding(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  user: AuthenticatedUser,
  Json(body): Json<AddPasskeyBody>,
) -> Result<impl IntoResponse, AuthError> {
  info!("Finalising new passkey for {}", user.email);

  let state = match session
    .get::<PasskeyRegistration>("add_passkey_state")
    .await?
  {
    Some(state) => state,
    None => {
      return Err(AuthError::CorruptSession);
    }
  };

  let _ = session.remove_value("add_passkey_state").await;

  match webauthn.finish_passkey_registration(&body.credential, &state) {
    Ok(passkey) => {
      match storage
        .create_passkey(user.id, &body.key_name, &passkey)
        .await
      {
        Ok(passkey) => Ok((StatusCode::CREATED, Json(passkey))),
        Err(err) => {
          error!("Couldn't store new passkey for {}: {:?}", user.email, err);
          Err(AuthError::Unknown)
        }
      }
    }
    Err(err) => {
      error!("Coulnd't verify new passkey for {}: {:?}", user.email, err);
      return Err(AuthError::InvalidCredentials);
    }
  }
}

pub async fn remove(
  Extension(storage): Extension<AuthStorage>,
  user: AuthenticatedUser,
  Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AuthError> {
  match storage.remove_passkey(user.id, id).await {
    Ok(_) => Ok(()),
    Err(err) => {
      error!("Couldn't remove passkey for {}: {:?}", user.email, err);
      Err(AuthError::Unknown)
    }
  }
}
