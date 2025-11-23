use figment::{
  providers::{Env, Format, Toml},
  Figment,
};
use serde::Deserialize;
use std::env;

use crate::bidding::config::Config as BiddingConfig;
use crate::wallet::config::Config as WalletConfig;

#[derive(Deserialize, Debug)]
pub struct Config {
  pub wallet: WalletConfig,
  pub bidding: BiddingConfig,
}

pub fn init() -> Result<Config, figment::Error> {
  let conf: Config = Figment::new()
    .merge(Toml::file(
      env::var("CONFIG_FILE").unwrap_or("config.toml".to_string()),
    ))
    .merge(Env::raw())
    .extract()?;

  log::info!("Loaded config: {conf:#?}");

  Ok(conf)
}
