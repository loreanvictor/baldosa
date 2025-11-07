use axum::{
  extract::{Request, State},
  http::{
    header::{HeaderMap, AUTHORIZATION},
    StatusCode,
  },
  middleware::Next,
  response::{IntoResponse, Response},
};

///
/// State that holds the key that incoming requests should have in their headers.
/// The key is expected to be in the `Authorization` header.`
///
#[derive(Clone)]
pub struct AuthState {
  /// The key that incoming requests should have in their headers.
  pub key: String,
}

///
/// Middleware function that checks if the incoming request has the correct key in its headers.
/// The key is expected to be in the `Authorization
///
pub async fn auth(
  State(state): State<AuthState>,
  headers: HeaderMap,
  request: Request,
  next: Next,
) -> Response {
  match headers
    .get(AUTHORIZATION)
    .and_then(|auth| auth.to_str().ok())
    .and_then(|auth| auth.strip_prefix("Bearer "))
  {
    Some(key) if key == state.key => next.run(request).await,
    _ => return (StatusCode::UNAUTHORIZED, "Unauthorized").into_response(),
  }
}
