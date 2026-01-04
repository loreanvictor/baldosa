use std::collections::HashMap;
use std::env;

use serde::Deserialize;
use tokio::fs;

#[derive(Debug, Clone)]
pub struct Config {
  pub sizes: Vec<u32>,
  pub blur: HashMap<u32, f32>,
}

#[derive(Deserialize, Debug)]
pub struct WrittenConfigBlurEntry {
  pub size: u32,
  pub amount: f32,
}

#[derive(Deserialize, Debug)]
pub struct WrittenConfig {
  pub sizes: Vec<u32>,
  pub blur: Vec<WrittenConfigBlurEntry>,
}

pub async fn init() -> Config {
  let config = fs::read_to_string(env::var("CONFIG_FILE").unwrap_or("config.toml".to_string()))
    .await
    .expect("Config file `config.toml` not found.");

  let config: WrittenConfig = toml::from_str(&config).expect("Config file lacks proper format.");

  Config {
    sizes: config.sizes,
    blur: config
      .blur
      .into_iter()
      .map(|entry| (entry.size, entry.amount))
      .collect(),
  }
}
