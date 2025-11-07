use std::fmt::{Debug, Formatter, Result as FmtResult};
use std::pin::Pin;

use async_trait::async_trait;
use futures::stream::Stream;
use image::Pixel;

///
/// Represts a coordinates (x, y) in the map.
///
pub type Coords = (i32, i32);

///
/// Represents a point in the map.
///
pub struct Point<P: Pixel + Send + Sync> {
  ///
  /// The coordinates of the point.
  ///
  pub coords: Coords,

  // TODO: color should later be used
  //       to generate large scale maps.
  ///
  /// The color of the point.
  ///
  #[allow(dead_code)]
  pub color: Vec<<P as Pixel>::Subpixel>,
}

impl<P: Pixel + Send + Sync> Debug for Point<P> {
  fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
    write!(f, "Point {{ coords: {:?} }}", self.coords)
  }
}

///
/// A storage mechanism for storing a map. A map is a potentially
/// infinite grid of potentially existing points, with each point potentially
/// bearing a color as well. The stored map is used to generate chunked bitmasks
/// of the published tiles, with each published tile being represented as a single
/// point on the map.
///
#[async_trait]
pub trait Storage<P: Pixel + Send + Sync>: Send + Sync {
  ///
  /// Puts a point on the map and stores it.
  ///
  async fn put(
    &self,
    coords: &Coords,
    color: &Vec<<P as Pixel>::Subpixel>,
  ) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;

  ///
  /// Deletes a point from the map.
  ///
  async fn delete(&self, coords: &Coords) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;

  ///
  /// Gets all points in the stored map in given rectangle
  /// (defined by two points). Returns a stream of points.
  ///
  async fn get<'a>(
    &'a self,
    from: &'a Coords,
    to: &'a Coords,
  ) -> Pin<Box<dyn Stream<Item = Point<P>> + Send + 'a>>;
}
