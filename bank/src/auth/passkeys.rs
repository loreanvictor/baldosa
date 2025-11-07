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

///
/// Starts the process of adding a new [webauthn](http://webauthn.io/) passkey
/// for the current user. The process is as follows:
///
/// 1. We generate a fresh challenge,
/// 2. We store the challenge in user's session for later verification,
/// 3. We send the challenge, alongside other authenticator options, to the client.
///
/// The client can pass the provided options directly to their
/// corresponding authenticator, with potentially minor data format adjustments.
/// We also provide the list of existing passkeys, so the authenticator ensures
/// no duplicates are added.
///
/// The client authenticator will then generate a new private / public key pair,
/// store the private key (and other passkey info) locally, sign the challenge (potentially
/// following a biometric prompt), and send the signature back to the server.
///
pub async fn start_adding(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, AuthError> {
  info!("Adding passkey for {}", user.email);

  let name = format!("{} {}", user.first_name, user.last_name);
  // clear any existing state
  let _ = session.remove_value("add_passkey_state").await;

  // find existing passkeys so we exclude them from the
  // process and don't add duplicates.
  let existing: Vec<CredentialID> = storage
    .get_passkeys(user.id)
    .await
    .unwrap_or(vec![])
    .iter()
    .map(|passkey| CredentialID::from(passkey.credential_id.clone()))
    .collect();

  //
  // 1. Generate a fresh challenge, alongside other authenticator options
  //
  match webauthn.start_passkey_registration(user.id, &user.email, &name, Some(existing)) {
    Ok((credential_options, state)) => {
      //
      // 2. Store the challenge in user's session for later verification
      //
      session.insert("add_passkey_state", &state).await?;

      //
      // 3. Send the challenge, alongside other authenticator options, to the client
      //
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

///
/// Finishes the process of adding a new [webauthn](http://webauthn.io/) passkey
/// for the current user.
///
/// At this stage in the process, the client has generated a new private / public key pair,
/// with the private key stored locally by the authenticator, and are sending the public key,
/// alongside the signed challenge, back to the server.
///
/// We now:
/// 1. Fetch the expected challenge from session,
/// 2. Verify the signature using the provided public key,
/// 3. Store the new passkey, associating it with current user.
///
/// The client is also expected to provide a human readable name for the passkey,
/// potentially based on the client's device / platform, so the user can later
/// identify this passkey and manage it.
///
/// The newly generated passkey is returned to the client.
///
pub async fn finish_adding(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  user: AuthenticatedUser,
  Json(body): Json<AddPasskeyBody>,
) -> Result<impl IntoResponse, AuthError> {
  info!("Finalising new passkey for {}", user.email);

  //
  // 1. Fetch the expected challenge from session
  //
  let Some(state) = session
    .get::<PasskeyRegistration>("add_passkey_state")
    .await?
  else {
    return Err(AuthError::CorruptSession);
  };

  let _ = session.remove_value("add_passkey_state").await;

  //
  // 2. Verify the signature using the provided public key
  //
  match webauthn.finish_passkey_registration(&body.credential, &state) {
    Ok(passkey) => {
      //
      // 3. Store the new passkey, associating it with current user
      //
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
      Err(AuthError::InvalidCredentials)
    }
  }
}

///
/// Returns all passkeys for current user.
/// Used in passkey management (to remove passkeys, for example).
///
pub async fn all(
  Extension(storage): Extension<AuthStorage>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, AuthError> {
  let passkeys = match storage.get_passkeys(user.id).await {
    Ok(passkeys) => {
      if passkeys.is_empty() {
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

///
/// Removes a passkey for the current user.
///
pub async fn remove(
  Extension(storage): Extension<AuthStorage>,
  user: AuthenticatedUser,
  Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AuthError> {
  match storage.remove_passkey(user.id, id).await {
    Ok(()) => Ok(()),
    Err(err) => {
      error!("Couldn't remove passkey for {}: {:?}", user.email, err);
      Err(AuthError::Unknown)
    }
  }
}
