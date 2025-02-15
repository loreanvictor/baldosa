use async_trait::async_trait;
use std::{ error::Error, sync::Arc, pin::Pin };
use futures::stream::{ Stream, StreamExt };
use image::Pixel;

use super::{ Storage, Coords, Point };
use super::target::MapTarget;
use super::schedule::{ Task, Scheduler };

use log::info;


const CHUNK_SIZE: u32 = 256;
const BITMAP_SIZE: usize = (CHUNK_SIZE * CHUNK_SIZE) as usize / 8;

#[derive(Clone)]
pub struct GenerateAndStoreBitmaskTask<P: Pixel + Send + Sync + 'static> {
  storage: Arc<dyn Storage<P>>,
  target: Arc<dyn MapTarget>,
}

impl <P: Pixel + Send + Sync + 'static> GenerateAndStoreBitmaskTask<P> {
  pub fn new(storage: Arc<dyn Storage<P>>, target: Arc<dyn MapTarget>) -> Self {
    Self {
      storage,
      target,
    }
  }
}

#[async_trait]
impl <P: Pixel + Send + Sync> Task for GenerateAndStoreBitmaskTask<P>
where <P as Pixel>::Subpixel: Send + Sync {
  async fn run(&self, start: &Coords) {
    info!("Generating bitmask for coords {:?}", start);
    let mut bitmask = vec![0u8; BITMAP_SIZE];
    let end = (start.0 + CHUNK_SIZE as i32, start.1 + CHUNK_SIZE as i32);
    let mut points = self.storage.get(&start, &end).await;

    while let Some(point) = points.next().await {
      let pos = (point.coords.0 - start.0, point.coords.1 - start.1);
      let bit_index = (pos.0 + pos.1 * CHUNK_SIZE as i32) as usize;
      let byte_index = bit_index / 8;
      let bit_offset = bit_index % 8;

      if byte_index < bitmask.len() {
        bitmask[byte_index] |= 1 << bit_offset;
      }
    }

    match self.target.save_bitmask(&start, &bitmask).await {
      Ok(()) => info!("Bitmask for coords {:?} saved", start),
      Err(err) => info!("Error saving bitmask for coords {:?}: {}", start, err),
    }
  }
}

pub struct Cartographer<P: Pixel + Send + Sync + 'static> {
  storage: Arc<dyn Storage<P>>,
  scheduler: Box<dyn Scheduler<GenerateAndStoreBitmaskTask<P>>>,
}

impl <P: Pixel + Send + Sync> Cartographer<P>
where <P as Pixel>::Subpixel: Send + Sync {
  pub fn new(
    storage: Arc<dyn Storage<P>>,
    target: Arc<dyn MapTarget>,
    mut scheduler: impl Scheduler<GenerateAndStoreBitmaskTask<P>> + 'static,
  ) -> Self {
    scheduler.assign(GenerateAndStoreBitmaskTask::new(Arc::clone(&storage), target));

    Self {
      storage,
      scheduler: Box::new(scheduler),
    }
  }
}

#[async_trait]
impl <P: Pixel + Send + Sync> Storage<P> for Cartographer<P>
where <P as Pixel>::Subpixel: Send + Sync {
  async fn put(
    &self,
    coords: &Coords,
    color: &Vec<<P as Pixel>::Subpixel>
  ) -> Result<(), Box<dyn Error + Send + Sync>> {
    match self.storage.put(coords, color).await {
      Ok(()) => {
        let anchor = (coords.0 / (CHUNK_SIZE as i32), coords.1 / (CHUNK_SIZE as i32));
        Ok(self.scheduler.schedule(&anchor).await)
      },
      err => err
    }
  }

  async fn delete(&self, coords: &Coords)
    -> Result<(), Box<dyn Error + Send + Sync>> {
      match self.storage.delete(coords).await {
        Ok(()) => {
          let anchor = (coords.0 / (CHUNK_SIZE as i32), coords.1 / (CHUNK_SIZE as i32));
          Ok(self.scheduler.schedule(&anchor).await)
        },
        err => err
      }
  }

  async fn get<'a>(&'a self, from: &'a Coords, to: &'a Coords)
    -> Pin<Box<dyn Stream<Item = Point<P>> + Send + 'a>> {
      self.storage.get(from, to).await
  }
}
