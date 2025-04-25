use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub struct Config {
  pub initial_balance: u32,
}
