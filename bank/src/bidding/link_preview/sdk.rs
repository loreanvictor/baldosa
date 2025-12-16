use serde::{Deserialize, Serialize};
use std::env;

use reqwest::Client;

use crate::bidding::link_preview::error::LinkPreviewError;

#[derive(Debug, Clone)]
pub struct LinkPreviewer {
  client: Client,
  key: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Preview {
  pub title: Option<String>,
  pub description: Option<String>,
  pub image: Option<String>,
  pub url: Option<String>,
}

impl LinkPreviewer {
  pub fn from_env() -> Self {
    let key = env::var("LINK_PREVIEW_API_KEY").expect("Missing LINK_PREVIEW_API_KEY");
    let client = Client::new();
    Self { client, key }
  }

  pub async fn resolve(&self, url: &str) -> Result<Preview, LinkPreviewError> {
    let response = self
      .client
      .get("https://api.linkpreview.net/")
      .header("X-Linkpreview-Api-Key", &self.key)
      .query(&[("q", url)])
      .send()
      .await
      .map_err(LinkPreviewError::RequestFailed)?;

    if !response.status().is_success() {
      return Err(LinkPreviewError::from_status(response.status()));
    }

    Ok(
      response
        .json::<Preview>()
        .await
        .map_err(LinkPreviewError::RequestFailed)?,
    )
  }
}
