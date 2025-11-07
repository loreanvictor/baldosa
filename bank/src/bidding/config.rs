use std::time::Duration;

use serde::Deserialize;

use super::book::Coords;
use super::upload;

///
/// Configuration for the bidding system. Includes the following:
/// - The guaranteed occupancy time for a tile (if a bid wins a tile, will stay on it at least for this long)
/// - The minimum bid required for a tile,
/// - A list of coordinates that cannot be bid on (system tiles, for example),
/// - The configuration for image upload
/// 
/// ### Example (TOML):
/// ```toml
/// guaranteed_occupancy = "1h"
/// minimum_bid = 1000
/// blocked_coords = ["0:0", "1:1"]
/// ```
///
#[derive(Clone, Debug, Deserialize)]
pub struct Config {
  ///
  /// The guaranteed occupancy time for a tile.
  /// If a bid wins a tile, the bidder will stay on it at least for this long. Any
  /// incoming bids in this time, alongside all other losing bids that are still open,
  /// will have to wait for the next auction, which occurs after this time has passed.
  /// 
  #[serde(with = "humantime_serde")]
  pub guaranteed_occupancy: Duration,
  /// The minimum bid required for a tile.
  pub minimum_bid: u32,
  /// A list of coordinates that cannot be bid on (system tiles, for example).
  pub blocked_coords: Vec<Coords>,
  /// Configuration for image upload
  pub image_upload: upload::Config,
}
