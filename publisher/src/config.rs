use serde::Deserialize;
use tokio::fs;
use std::{ collections::HashMap, sync::Arc };


pub struct Config {
  pub source_dir: String,
  pub target_dir: String,
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
  pub source_dir: String,
  pub target_dir: String,
  pub sizes: Vec<u32>,
  pub blur: Vec<WrittenConfigBlurEntry>,
}

pub async fn init() -> Arc<Config> {
  let config = fs::read_to_string("config.toml")
    .await
    .expect("Config file `config.toml` not found.");

  let config: WrittenConfig = toml::from_str(&config)
    .expect("Config file lacks proper format.");

  Arc::new(Config {
    source_dir: config.source_dir,
    target_dir: config.target_dir,
    sizes: config.sizes,
    blur: config.blur.into_iter().map(|entry| (entry.size, entry.amount)).collect(),
  })
}
