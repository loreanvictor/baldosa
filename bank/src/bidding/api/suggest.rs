use axum::{
  extract::{Extension, Json, Query},
  response::IntoResponse,
};
use serde::Deserialize;

use super::super::link_preview::{error::LinkPreviewError, LinkPreviewer, Preview};
use crate::auth::AuthenticatedUser;

#[derive(Debug, Deserialize)]
pub struct SuggestQuery {
  pub url: String,
}

pub async fn suggest(
  Query(SuggestQuery { url }): Query<SuggestQuery>,
  Extension(link_previewer): Extension<LinkPreviewer>,
  _: AuthenticatedUser,
) -> Result<impl IntoResponse, LinkPreviewError> {
  let preview: Preview = link_previewer.resolve(&url).await?;
  Ok(Json(preview))
}
