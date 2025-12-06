use std::env;

use log::error;
use reqwest::{Client, StatusCode};
use serde::Serialize;

use super::super::book::{Bid, Coords};
use super::auth::Auth;
use super::error::PublishError;

#[derive(Debug, Serialize)]
struct PublishRequest {
  source: String,
  title: String,
  subtitle: Option<String>,
  description: Option<String>,
  link: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Publisher {
  client: Client,
  url: String,
  auth: Auth,
}

impl Publisher {
  pub fn from_env() -> Self {
    let url = env::var("PUBLISHER_URL").expect("Missing PUBLISHER_URL");
    let auth = Auth::from_env();
    let client = Client::new();
    Self { client, url, auth }
  }

  pub async fn publish(&self, bid: &Bid) -> Result<(), PublishError> {
    let response = self
      .auth
      .apply(
        self
          .client
          .put(format!("{}/{}:{}", self.url, bid.x, bid.y))
          .json(&PublishRequest {
            source: bid.content.image.clone().expect("Missing image"),
            title: bid.content.title.clone().unwrap_or_default(),
            subtitle: bid.content.subtitle.clone(),
            description: bid.content.description.clone(),
            link: bid.content.url.clone(),
          }),
      )
      .send()
      .await
      .map_err(|e| {
        error!("Failed to publish bid: {e}");
        match e.status() {
          Some(StatusCode::UNAUTHORIZED) => PublishError::Unauthorized,
          _ => PublishError::Unknown,
        }
      })?;

    if response.status() == StatusCode::UNAUTHORIZED {
      Err(PublishError::Unauthorized)
    } else if !response.status().is_success() {
      error!("Failed to publish bid: {}", response.status());
      error!(
        "Response: {}",
        response.text().await.unwrap_or(String::new())
      );
      return Err(PublishError::Unknown);
    } else {
      Ok(())
    }
  }

  pub async fn unpublish(&self, coords: &Coords) -> Result<(), PublishError> {
    let response = self
      .auth
      .apply(
        self
          .client
          .delete(format!("{}/{}:{}", self.url, coords.x, coords.y)),
      )
      .send()
      .await
      .map_err(|e| {
        error!("Failed to unpublish tile: {e}");
        match e.status() {
          Some(StatusCode::UNAUTHORIZED) => PublishError::Unauthorized,
          _ => PublishError::Unknown,
        }
      })?;

    if response.status() == StatusCode::UNAUTHORIZED {
      Err(PublishError::Unauthorized)
    } else if !response.status().is_success() {
      error!("Failed to unpublish bid: {}", response.status());
      error!(
        "Response: {}",
        response.text().await.unwrap_or(String::new())
      );
      Err(PublishError::Unknown)
    } else {
      Ok(())
    }
  }
}
