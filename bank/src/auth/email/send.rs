use std::sync::Arc;
use resend_rs::{ types::CreateEmailBaseOptions, Resend };
use serde::Deserialize;
use axum::{ extract::{ Extension, Json, State }, response::IntoResponse };

use super::super::error::AuthError;
use super::super::storage::AuthStorage;
use super::super::AuthenticatedUser;
use super::code::CodesRepository;


#[derive(Deserialize, Debug)]
pub struct EmailOtcBody {
  pub email: String,
}

fn email_html_for_code(first_name: &str, last_name: &str, code: &str, msg: &str) -> String {
  format!("
    <div style='font-family: monospace; max-width: 360px'>
    <p><b>Dear {} {}</b></p>
    <p>
      {}
      <br/><br/>
      <b style='font-size: 4em; font-weight: 100'>{}</b>
    </p>
    <br/>
    <div style='display: flex'>
      <p style='margin: 0; margin-right: 2ch; padding: 0; background: #222831; color: #FFF5E0; border-radius: 7px;'>
⠀⠀⠀⠀⠀⠀⠀⠀<br/>
⠀⠀▝▘⠀⠀⠀⠀<br/>
⠀⠀▝▚▖▗▖⠀<br/>
⠀▗▞▚▖▗▞▘<br/>
⠀⠀⠀⠀⠀⠀⠀
      </p>
      <p>
        <br/>
        Best Regards,<br/>
        The Baldosa Team
      </p>
    </div>
  ", first_name, last_name, msg, code)
}

pub async fn send_auth_otc(
  State(codes): State<Arc<CodesRepository>>,
  Extension(storage): Extension<AuthStorage>,
  Extension(resend): Extension<Resend>,
  Json(body): Json<EmailOtcBody>,
) -> Result<impl IntoResponse, AuthError> {
  let user = match storage.find_user_by_email(&body.email).await {
    Ok(Some(user)) => user,
    _ => { return Err(AuthError::UserNotFound); },
  };

  let code = match codes.create(&user.id, "auth_with_email").await {
    Ok(code) => code,
    Err(err) => { return Err(err); },
  };

  let from = "Baldosa <auth@baldosa.city>";
  let to = [ body.email ];
  let subject = format!("Baldosa Login Code: {}", code);

  match resend.emails.send(
    CreateEmailBaseOptions::new(from, to, subject)
      .with_html(&email_html_for_code(&user.first_name, &user.last_name, &code,
        "
        Here is your authentication code for logging in into <a href='https://baldosa.city'>Baldosa</a>.
        If you didn't request this code, please ignore this message.
        "
      ))
  ).await {
    Ok(_) => Ok(()),
    Err(_) => Err(AuthError::Unknown),
  }
}

pub async fn send_verification_code(
  State(codes): State<Arc<CodesRepository>>,
  Extension(resend): Extension<Resend>,
  user: AuthenticatedUser,
) -> Result<impl IntoResponse, AuthError> {
  if let Some(_) = user.verification.email_verified_at {
    return Err(AuthError::AlreadyVerified);
  }

  let code = match codes.create(&user.id, "verify_email").await {
    Ok(code) => code,
    Err(err) => { return Err(err); },
  };

  let from = "Baldosa <auth@baldosa.city>";
  let to = [ user.email ];
  let subject = format!("Baldosa Verification Code: {}", code);

  match resend.emails.send(
    CreateEmailBaseOptions::new(from, to, subject)
      .with_html(&email_html_for_code(&user.first_name, &user.last_name, &code,
        "
        Here is the code for verifying your email address for your account on <a href='https://baldosa.city'>Baldosa</a>.
        If you didn't request this code, or don't have a Baldosa account, please ignore this message.
        "
      ))
  ).await {
    Ok(_) => Ok(()),
    Err(_) => Err(AuthError::Unknown),
  }
}
