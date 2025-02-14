use std::fmt::{ Debug, Formatter, Result as FmtResult };
use std::pin::Pin;
use futures::stream::Stream;
use async_trait::async_trait;
use image::Pixel;


pub type Coords = (i32, i32);

pub struct Point<P: Pixel + Send + Sync> {
  pub coords: Coords,

  // TODO: color should later be used
  //       to generate large scale maps.
  #[allow(dead_code)]
  pub color: Vec<<P as Pixel>::Subpixel>,
}

impl <P: Pixel + Send + Sync> Debug for Point<P> {
  fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
    write!(f, "Point {{ coords: {:?} }}", self.coords)
  }
}

#[async_trait]
pub trait Storage<P: Pixel + Send + Sync>: Send + Sync {
  async fn put(
    &self,
    coords: &Coords,
    color: &Vec<<P as Pixel>::Subpixel>
  ) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;

  async fn delete(&self, coords: &Coords)
    -> Result<(), Box<dyn std::error::Error + Send + Sync>>;

  async fn get<'a>(&'a self, from: &'a Coords, to: &'a Coords) -> Pin<Box<dyn Stream<Item = Point<P>> + Send + 'a>>;
}
