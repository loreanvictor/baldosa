use async_trait::async_trait;
use std::error::Error;
use super::Coords;

#[async_trait]
pub trait MapTarget: Send + Sync {
  async fn save_bitmask(&self, coords: &Coords, mask: &[u8]) -> Result<(), Box<dyn Error + Send + Sync>>;
}

pub struct NullTarget {}

#[async_trait]
impl MapTarget for NullTarget {
  async fn save_bitmask(&self, _: &Coords, _: &[u8]) -> Result<(), Box<dyn Error + Send + Sync>> {
    Ok(())
  }
}
