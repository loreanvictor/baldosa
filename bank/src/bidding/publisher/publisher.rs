use std::env;

use log::error;
use reqwest::{Client, StatusCode};
use serde::Serialize;

use super::super::bid::Bid;
use super::auth::Auth;
use super::error::PublishError;

#[derive(Debug, Serialize)]
struct PublishRequest {
  source: String,
  title: String,
  subtitle: String,
  description: String,
  link: String,
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
            title: bid.content.title.clone().unwrap_or("".to_string()),
            subtitle: bid.content.subtitle.clone().unwrap_or("".to_string()),
            description: bid.content.description.clone().unwrap_or("".to_string()),
            link: bid.content.url.clone().unwrap_or("".to_string()),
          }),
      )
      .send()
      .await
      .map_err(|e| {
        error!("Failed to publish bid: {}", e);
        match e.status() {
          Some(StatusCode::UNAUTHORIZED) => PublishError::Unauthorized,
          _ => PublishError::Unknown,
        }
      })?;

    if response.status() == StatusCode::UNAUTHORIZED {
      return Err(PublishError::Unauthorized);
    } else if !response.status().is_success() {
      error!("Failed to publish bid: {}", response.status());
      error!(
        "Response: {}",
        response.text().await.unwrap_or("".to_string())
      );
      return Err(PublishError::Unknown);
    } else {
      Ok(())
    }
  }
}
