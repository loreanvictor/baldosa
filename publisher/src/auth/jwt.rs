use serde::{ Deserialize, Serialize };
use axum::{
  extract::{ Request, State },
  http::{ header::{ HeaderMap, AUTHORIZATION }, StatusCode },
  response::{ IntoResponse, Response },
  middleware::Next,
};
use jsonwebtoken::{ decode, DecodingKey, Validation, errors::Error as JwtError, errors::ErrorKind };


#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
  pub sub: String,
  pub exp: usize,
}

///
/// State that holds the secret with which the signature of incoming requests
/// should be verified. Incoming requests should have a JWT token in their `Authorization` header, signed
/// with the secret. The token should also have a matching subject.
///
#[derive(Clone)]
pub struct JwtState {
  /// Secret with which the signature of incoming requests should be verified.
  pub secret: String,

  /// Subject that the token should have.
  pub subject: String,
}

///
/// Middleware function that checks if the incoming request has a valid JWT token in its `Authorization` header.
/// The token is expected to be signed with the secret, and not to be expired.
///
pub async fn auth(
  State(state): State<JwtState>,
  headers: HeaderMap,
  request: Request,
  next: Next,
) -> Response {
  match verify_token(&headers, &state.secret, &state.subject) {
    Ok(_) => next.run(request).await,
    Err(error) => (
      StatusCode::UNAUTHORIZED,
      match error.kind() {
        ErrorKind::InvalidSubject => "Invalid token subject",
        ErrorKind::ExpiredSignature => "Token expired",
        _ => "Invalid token",
      }
    ).into_response(),
  }
}

fn verify_token(headers: &HeaderMap, secret: &str, subject: &str) -> Result<Claims, JwtError> {
  headers
    .get(AUTHORIZATION)
    .and_then(|auth| auth.to_str().ok())
    .and_then(|auth| auth.strip_prefix("Bearer "))
    .ok_or(JwtError::from(ErrorKind::InvalidToken))
    .and_then(|token| {
      decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
      ).and_then(|data| {
        match &data.claims.sub {
          sub if sub == subject => Ok(data.claims),
          _ => Err(JwtError::from(ErrorKind::InvalidSubject)),
        }
      })
    })
}
