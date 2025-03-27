use resend_rs::{ Resend, types::CreateEmailBaseOptions };
use serde::Deserialize;
use axum::{ extract::{ Extension, Json }, response::IntoResponse };

use super::error::AuthError;
use super::storage::AuthStorage;
use super::otc::OneTimeCodes;
use super::user::AuthenticatedUser;


#[derive(Deserialize, Debug)]
pub struct EmailOtcBody {
  pub email: String,
}

pub async fn send_auth_otc(
  Extension(otc): Extension<OneTimeCodes>,
  Extension(storage): Extension<AuthStorage>,
  Json(body): Json<EmailOtcBody>,
) -> Result<impl IntoResponse, AuthError> {
  let user = match storage.find_user_by_email(&body.email).await {
    Ok(Some(user)) => user,
    _ => { return Err(AuthError::UserNotFound); },
  };

  let code = match otc.create(&user.id, "auth_with_email").await {
    Ok(code) => code,
    Err(_) => { return Err(AuthError::Unknown); },
  };

  let resend = Resend::default();
  let from = "Baldosa <auth@baldosa.city>";
  let to = [ body.email ];
  let subject = format!("Baldosa Login Code: {}", code.code);

  match resend.emails.send(
    CreateEmailBaseOptions::new(from, to, subject)
      .with_html(format!("
        <div style='font-family: monospace; max-width: 360px'>
          <p><b>Dear {} {}</b></p>
          <p>
            Here's your authentication code for logging in into <a href='https://baldosa.city'>Baldosa</a>.
            If you didn't request this code, please ignore this message.
            <br/><br/>
            <b style='font-size: 4em; font-weight: 100'>{}</b>
          </p>
          <br/>
          <pre style='margin: 0; padding: 0;'>
 ▝▘
 ▝▚▖▗▖    Best Regards,
▗▞▚▖▗▞▘   The Baldosa Team
          </pre>
        </div>
        ", user.first_name, user.last_name, code.code).as_str()
      )
  ).await {
    Ok(_) => Ok(()),
    Err(_) => Err(AuthError::Unknown),
  }
}


#[derive(Deserialize, Debug)]
pub struct AuthenticateWithEmailBody {
  pub email: String,
  pub code: String,
}

pub async fn authenticate(
  Extension(otc): Extension<OneTimeCodes>,
  Extension(storage): Extension<AuthStorage>,
  Json(body): Json<AuthenticateWithEmailBody>,
) -> Result<impl IntoResponse, AuthError> {
  let user = match storage.find_user_by_email(&body.email).await {
    Ok(Some(user)) => user,
    _ => { return Err(AuthError::UserNotFound); },
  };

  match otc.consume(&user.id, &body.code, "auth_with_email").await {
    Ok(()) => (),
    Err(_) => { return Err(AuthError::InvalidCredentials); },
  }

  // TODO: also the user's email is verified at this stage.

  Ok(Json(AuthenticatedUser::sign(user.id, user.email, user.first_name, user.last_name)))
}
