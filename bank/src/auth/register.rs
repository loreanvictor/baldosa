use std::sync::Arc;

use axum::{
  extract::{Extension, Json},
  http::StatusCode,
  response::IntoResponse,
};
use log::{error, info};
use serde::Deserialize;
use tower_sessions::Session;
use webauthn_rs::prelude::*;

use super::error::AuthError;
use super::storage::AuthStorage;
use super::user::{AuthenticatedUser, VerificationStatus};

#[derive(Deserialize, Debug)]
pub struct StartRegistrationBody {
  pub email: String,
  pub first_name: String,
  pub last_name: String,
}

///
/// Starts the registration process for a new user
/// using a [webauthn](https://webauthn.io) passkey.
///
/// For registration, user email is used as identifier,
/// though we don't verify email at this stage. Email is used
/// as an identifier that users can remember and recognize,
/// and can be universally verified later. However, any
/// other identifier would work for this purpose.
///
/// The process is as follows:
/// 1. We first ensure the user isn't registered already,
/// 2. We generate a fresh challenge, and a unique ID (besides email) for the user,
/// 3. We store the challenge in user's session for later verification,
/// 4. We send the challenge, alongside other authenticator options, to the client.
///
/// The client can pass the provided options directly to their
/// corresponding authenticator, with potentially minor data format adjustments.
/// ```js
/// const res = await fetch('.../register/start', {
///   method: 'POST',
///   credentials: 'include',
///   body: JSON.stringify({ email: 'Z3ZK6@example.com', first_name: ..., last_name: ... })
///   ...
/// })
/// const opts = await res.json()
/// opts.publicKey.challenge = Base64.toUint8Array(opts.publicKey.challenge)
/// opts.publicKey.user.id = Base64.toUint8Array(opts.publicKey.user.id)
/// ...
/// const cred = await navigator.credentials.create(opts)
/// ```
/// The client then generates a public / private key pair (following some user prompt, e.g. biometrics),
/// stores the private key (alongside other passkey information) locally, and signs the
/// provided challenge alongside the public key to the server.
///
pub async fn start(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  Json(body): Json<StartRegistrationBody>,
) -> Result<impl IntoResponse, AuthError> {
  info!("Starting registration for {}", body.email);

  //
  // 1. Ensure the user isn't registered already
  //
  match storage.find_user_by_email(body.email.as_str()).await {
    Ok(Some(_)) => {
      error!("User already exists");
      return Err(AuthError::UserExists);
    }
    Ok(None) => {}
    Err(err) => {
      error!("Error checking user existence: {err:?}");
      return Err(AuthError::Unknown);
    }
  }

  // clean up the session
  let _ = session.remove_value("reg_state").await;

  let email = body.email;
  let first_name = body.first_name;
  let last_name = body.last_name;
  let name = format!("{} {}", &first_name, &last_name);

  //
  // 2.1. Generate a unique ID for the user
  //
  let unique_user_id = Uuid::new_v4();

  //
  // 2.2. Generate a fresh challenge for the user to sign
  //
  match webauthn.start_passkey_registration(unique_user_id, &email, &name, None) {
    Ok((credential_options, reg_state)) => {
      //
      // 3. Store the challenge in user's session for later verification
      //
      session
        .insert(
          "reg_state",
          (unique_user_id, email, first_name, last_name, reg_state),
        )
        .await?;
      //
      // 4. Send the challenge, alongside other options, to the client
      //
      Ok(Json(credential_options))
    }
    Err(_) => Err(AuthError::Unknown),
  }
}

#[derive(Deserialize, Debug)]
pub struct RegisterWithPasskeyBody {
  pub credential: RegisterPublicKeyCredential,
  pub key_name: String,
}

///
/// Finishes the registration process for a new user
/// using a [webauthn](https://webauthn.io) passkey.
///
/// At this stage in the process, the client has generated a new private / public key pair,
/// with the private key stored locally by the authenticator, and are sending the public key,
/// alongside the signed challenge, back to the server.
///
/// We now:
/// 1. Fetch the expected challenge from session,
/// 2. Verify the signature using the provided public key,
/// 3. Create new user (if need be, which it typically should),
/// 4. Create a new passkey and associate it with the user,
/// 5. Return a signed token (automatically logging the user in).
///
/// The client is also expected to provide a human readable name for the passkey,
/// potentially based on the client's device / platform, so the user can later
/// identify this passkey and manage it.
///
pub async fn finish(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  Json(body): Json<RegisterWithPasskeyBody>,
) -> Result<impl IntoResponse, AuthError> {
  //
  // 1. Fetch the expected challenge from session
  //
  let Some((unique_user_id, email, first_name, last_name, reg_state)) = session
    .get::<(Uuid, String, String, String, PasskeyRegistration)>("reg_state")
    .await?
  else {
    return Err(AuthError::CorruptSession);
  };

  let _ = session.remove_value("reg_state").await;

  //
  // 2. Verify the signature using the provided public key
  //
  match webauthn.finish_passkey_registration(&body.credential, &reg_state) {
    Ok(passkey) => {
      info!("Registration finished for: {email}");

      //
      // 3. Create new user (if need be, which it typically should),
      //
      match storage.find_user_by_email(email.as_str()).await {
        Ok(Some(_)) => {}
        Ok(None) => storage
          .create_user(unique_user_id, &email, &first_name, &last_name)
          .await
          .map_err(|_| AuthError::Unknown)?,
        Err(err) => {
          error!("Error checking user existence: {err:?}");
          return Err(AuthError::Unknown);
        }
      }

      //
      // 4. Create a new passkey and associate it with the user,
      //
      match storage
        .create_passkey(unique_user_id, &body.key_name, &passkey)
        .await
      {
        Ok(_) => Ok((
          StatusCode::CREATED,
          //
          // 5. Return a signed token, automatically logging the user in
          //
          Json(AuthenticatedUser::sign(
            unique_user_id,
            email,
            first_name,
            last_name,
            VerificationStatus::default(),
          )),
        )),
        Err(err) => {
          error!("Error creating passkey: {err:?}");
          Err(AuthError::Unknown)
        }
      }
    }
    Err(err) => {
      error!("Registration failed: {err:?}");
      Err(AuthError::InvalidCredentials)
    }
  }
}
