use std::sync::Arc;
use serde::Deserialize;
use webauthn_rs::prelude::*;
use tower_sessions::Session;
use axum::{ extract::{ Extension, Json }, response::IntoResponse };

use log::{ info, error };

use super::error::AuthError;
use super::storage::AuthStorage;
use super::user::AuthenticatedUser;


#[derive(Deserialize, Debug)]
pub struct StartRegistrationBody {
  pub email: String,
  pub first_name: String,
  pub last_name: String,
}

pub async fn start(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  Json(body): Json<StartRegistrationBody>,
) -> Result<impl IntoResponse, AuthError> {
  info!("Starting registration for {}", body.email);

  match storage.find_user_by_email(body.email.as_str()).await {
    Ok(Some(_)) => {
      error!("User already exists");
      return Err(AuthError::UserExists);
    },
    Ok(None) => {},
    Err(err) => {
      error!("Error checking user existence: {:?}", err);
      return Err(AuthError::Unknown);
    },
  }

  let email = body.email;
  let first_name = body.first_name;
  let last_name = body.last_name;
  let name = format!("{} {}", &first_name, &last_name);
  let unique_user_id = Uuid::new_v4();
  let _ = session.remove_value("reg_state").await;

  match webauthn.start_passkey_registration(unique_user_id, &email, &name, None) {
    Ok((credential_options, reg_state)) => {
      session.insert("reg_state", (unique_user_id, email, first_name, last_name, reg_state)).await?;
      Ok(Json(credential_options))
    },
    Err(_) => Err(AuthError::Unknown),
  }
}

#[derive(Deserialize, Debug)]
pub struct RegisterWithPasskeyBody {
  pub credential: RegisterPublicKeyCredential,
  pub key_name: String,
}

pub async fn finish(
  Extension(webauthn): Extension<Arc<Webauthn>>,
  Extension(storage): Extension<AuthStorage>,
  session: Session,
  Json(body): Json<RegisterWithPasskeyBody>,
) -> Result<impl IntoResponse, AuthError> {
  let (unique_user_id, email, first_name, last_name, reg_state) = 
    match session.get::<(Uuid, String, String, String, PasskeyRegistration)>("reg_state").await? {
      Some((unique_user_id, email, first_name, last_name, reg_state)) =>
        (unique_user_id, email, first_name, last_name, reg_state),
      None => return Err(AuthError::CorruptSession),
  };

  let _ = session.remove_value("reg_state").await;
  match webauthn.finish_passkey_registration(&body.credential, &reg_state) {
    Ok(passkey) => {
      info!("Registration finished for: {}", email);

      match storage.find_user_by_email(email.as_str()).await {
        Ok(Some(_)) => {},
        Ok(None) => storage.create_user(unique_user_id, &email, &first_name, &last_name)
            .await.map_err(|_| AuthError::Unknown)?,
        Err(err) => {
          error!("Error checking user existence: {:?}", err);
          return Err(AuthError::Unknown);
        },
      }

      match storage.create_passkey(unique_user_id, &body.key_name, &passkey).await {
          Ok(_) => Ok(Json(AuthenticatedUser::sign(unique_user_id, email, first_name, last_name))),
          Err(err) => {
            error!("Error creating passkey: {:?}", err);
            return Err(AuthError::Unknown);
          },
        }
    },
    Err(err) => {
      error!("Registration failed: {:?}", err);
      Err(AuthError::InvalidCredentials)
    },
  }
}
