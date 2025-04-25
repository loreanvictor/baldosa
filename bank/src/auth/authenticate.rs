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

///
/// Starts a [webauthn](https://webauthn.io) passkey authentication session.
///
/// 1. We create a challenge on the server,
/// 2. We store the challenge in user's session for later verification,
/// 3. We send the challenge, alongside other options, to the client.
///
/// The client can pass the provided options directly to their
/// corresponding authenticator, with potentially minor data format adjustments.
///
/// ```js
/// const res = await fetch('.../authenticate/start', {
///   method: 'POST',
///   credentials: 'include',
/// })
/// const opts = await res.json()
/// opts.publicKey.challenge = Base64.toUint8Array(opts.publicKey.challenge)
/// delete opts.mediation
/// const cred = await navigator.credentials.get(opts)
/// // 👆 this credential now needs to be
/// //   formatted and sent back to the server
/// ```
///
/// The provided options will instruct the authenticator to allow the user
/// to select amongst registered passkeys, authenticate the user (e.g. via biometrics),
/// and then sign the challenge using selected passkey's private key (which is stored locally by the authenticator).
/// We have already stored the passkey information alongside its public key,
/// which we will then use to verify the signature.
///
pub async fn start(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  session: Session,
) -> Result<impl IntoResponse, AuthError> {
  //
  // 1. Create the challenge (and other options for client authenticator)
  //
  match webauthn.start_discoverable_authentication() {
    Ok((credential_options, reg_state)) => {
      //
      // 2. Store the challenge in user's session for later verification
      //    Note that this is only safe because we are using a server-side
      //    session storage, as otherwise it'd be open to tampering or replay
      //    attacks.
      //
      session.insert("auth_state", reg_state).await?;

      //
      // 3. Send the challenge and other autehtnicator options to the client
      //
      Ok(Json(credential_options))
    }
    Err(_) => Err(AuthError::Unknown),
  }
}

#[derive(Deserialize, Debug)]
pub struct AuthenticateWithPasskeyBody {
  pub credential: PublicKeyCredential,
}

///
/// Finishes the [webauthn](https://webauthn.io) passkey authentication session.
///
/// At this point, the user has selected a passkey to authenticate with,
/// and the client has signed the challenge we previously sent them using
/// the corresponding private key of this challenge. We now:
///
/// 1. Fetch the expected challenge from session,
/// 2. Find the passkey in our storage, based on the ID provided by the client,
/// 3. Verify the signature using the passkey's public key,
/// 4. If need be, update passkey information (see [this](https://docs.rs/webauthn-rs/latest/webauthn_rs/prelude/struct.Passkey.html#method.update_credential))
/// 5. Find the corresponding user, and return a signed token.
///
pub async fn finish(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  Json(body): Json<AuthenticateWithPasskeyBody>,
) -> Result<impl IntoResponse, AuthError> {
  //
  // 1. Fetch the expected challenge from session
  //
  let Some(reg_state) = session
    .get::<DiscoverableAuthentication>("auth_state")
    .await?
  else {
    return Err(AuthError::CorruptSession);
  };

  // parse provided credentials
  let Ok((uuid, cred_id)) = webauthn.identify_discoverable_authentication(&body.credential) else {
    return Err(AuthError::InvalidCredentials);
  };

  //
  // 2. Find the passkey in our storage, based on the ID provided by the client
  //
  let Ok(passkeys) = storage.get_passkeys(uuid).await else {
    return Err(AuthError::UserNotFound);
  };

  let Some(passkey) = passkeys.iter().find(|key| key.credential_id == cred_id) else {
    return Err(AuthError::InvalidCredentials);
  };

  let discoverable_keys = passkeys
    .iter()
    .map(|key| DiscoverableKey::from(&key.passkey_data))
    .collect::<Vec<_>>();

  //
  // 3. Verify the signature using the passkey's public key
  //
  match webauthn.finish_discoverable_authentication(
    &body.credential,
    reg_state,
    discoverable_keys.as_ref(),
  ) {
    Ok(auth_result) => {
      //
      // 4. If need be, update passkey information
      //
      if auth_result.needs_update() {
        let mut passkey = passkey.passkey_data.clone();
        passkey.update_credential(&auth_result);
        let _ = storage.update_passkey(uuid, &passkey).await;
      }

      //
      // 5. Find the corresponding user, and return a signed token
      //
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
    Err(_) => Err(AuthError::InvalidCredentials),
  }
}
