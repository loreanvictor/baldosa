use std::error::Error;

use async_trait::async_trait;

use super::super::Coords;

///
/// A target to store chunk bitmasks of a map. A chunk bitmask is a bitmask
/// representing a finite chunk of an infinite map, and can be used to quickly determine
/// if a point exists within the chunk (i.e. if a tile is published or not).
///
#[async_trait]
pub trait BitmaskTarget: Send + Sync {
  ///
  /// Save a given chunk bitmask to the target.
  ///
  async fn save_bitmask(
    &self,
    coords: &Coords,
    mask: &[u8],
  ) -> Result<(), Box<dyn Error + Send + Sync>>;
}

pub struct NullTarget {}

#[async_trait]
impl BitmaskTarget for NullTarget {
  async fn save_bitmask(&self, _: &Coords, _: &[u8]) -> Result<(), Box<dyn Error + Send + Sync>> {
    Ok(())
  }
}
