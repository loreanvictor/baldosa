use std::time::Duration;

use serde::Deserialize;

use super::coords::Coords;
use super::upload;

#[derive(Clone, Debug, Deserialize)]
pub struct Config {
  #[serde(with = "humantime_serde")]
  pub guaranteed_occupancy: Duration,
  pub blocked_coords: Vec<Coords>,
  pub image_upload: upload::Config,
}
