use std::env;
use std::path::Path;

use dotenvy::{dotenv_iter, dotenv_override, from_path, from_path_iter};
use log::debug;

fn is_sensitive_key(key: &str) -> bool {
  let lowered = key.to_lowercase();
  lowered.contains("secret")
    || lowered.contains("key")
    || lowered.contains("token")
    || lowered.contains("password")
}

fn mask(val: &str) -> String {
  "*".repeat(val.len())
}

fn debug_env_kv(key: &str, val: &str) {
  let sensitive = is_sensitive_key(key);
  let debug_sensitive = env::var("DEBUG_SENSITIVE_ENV").unwrap_or("false".to_string()) == "true";

  match (sensitive, debug_sensitive) {
    (true, false) => debug!("{}={}", key, mask(val)),
    _ => debug!("{key}={val}"),
  }
}

pub fn init() -> Result<(), dotenvy::Error> {
  let parent = Path::new("../.env");
  from_path(parent).ok();
  dotenv_override().ok();
  env_logger::init();

  for item in from_path_iter(parent)? {
    let (key, val) = item?;
    debug_env_kv(&key, &val);
  }

  for item in dotenv_iter()? {
    let (key, val) = item?;
    debug_env_kv(&key, &val);
  }

  Ok(())
}
