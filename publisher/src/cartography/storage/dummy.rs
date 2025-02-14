use async_trait::async_trait;
use futures::stream::{ self, Stream };
use std::{ error::Error, pin::Pin };
use image::Rgb;

use super::storage::{ Storage, Coords, Point };

pub struct DummyMapStorage {}

impl DummyMapStorage {
  #[allow(dead_code)]
  pub fn new() -> Self {
    Self {}
  }
}

#[async_trait]
impl Storage<Rgb<u8>> for DummyMapStorage {
  async fn put(
    &self,
    _: &Coords,
    _: &Vec<u8>
  ) -> Result<(), Box<dyn Error + Send + Sync>> {
    Ok(())
  }

  async fn delete(&self, _: &Coords)
    -> Result<(), Box<dyn Error + Send + Sync>> {
      Ok(())
  }

  async fn get<'a>(&'a self, _: &'a Coords, _: &'a Coords) -> Pin<Box<dyn Stream<Item = Point<Rgb<u8>>> + Send + 'a>> {
    Box::pin(stream::empty())
  }
}
