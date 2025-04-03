use std::path::Path;

use dotenvy::{dotenv_iter, dotenv_override, from_path, from_path_iter};
use env_logger;
use log::debug;

pub fn init() -> Result<(), dotenvy::Error> {
  let parent = Path::new("../.env");
  from_path(parent).ok();
  dotenv_override().ok();
  env_logger::init();

  for item in from_path_iter(parent)? {
    let (key, val) = item?;
    debug!("{}={}", key, val);
  }

  for item in dotenv_iter()? {
    let (key, val) = item?;
    debug!("{}={}", key, val);
  }

  Ok(())
}
