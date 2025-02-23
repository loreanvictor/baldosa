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

///
/// A task that generates a bitmask for a chunk of the map and stores it
/// in the bitmask target.
///
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

    //
    // create a bitmask for the chunk
    //
    let mut bitmask = vec![0u8; BITMAP_SIZE];

    //
    // get the stored coordinates within the chunk
    //
    let end = (start.0 + CHUNK_SIZE as i32, start.1 + CHUNK_SIZE as i32);
    let mut points = self.storage.get(&start, &end).await;

    //
    // set the corresponding bit of each point
    //
    while let Some(point) = points.next().await {

      // the position of the point within the chunk
      let pos = (point.coords.0 - start.0, point.coords.1 - start.1);

      // the index of the bit in the bitmask
      let bit_index = (pos.0 + pos.1 * CHUNK_SIZE as i32) as usize;

      // the index of the byte containing target bit
      let byte_index = bit_index / 8;

      // the offset of the target bit within the byte
      let bit_offset = bit_index % 8;

      if byte_index < bitmask.len() {
        // flip the bit to 1
        bitmask[byte_index] |= 1 << bit_offset;
      }
    }

    match self.target.save_bitmask(&start, &bitmask).await {
      Ok(()) => info!("Bitmask for coords {:?} saved", start),
      Err(err) => info!("Error saving bitmask for coords {:?}: {}", start, err),
    }
  }
}

///
/// A cartographer that schedules a bitmask generation task
/// for each affected chunk of the map when a point is stored or deleted
/// in that chunk. The cartographer uses a storage to store the points
/// and read the stored points when generating / updating the bitmask,
/// and a target to store the generated bitmask.
///
pub struct Cartographer<P: Pixel + Send + Sync + 'static> {
  storage: Arc<dyn Storage<P>>,
  scheduler: Box<dyn Scheduler<GenerateAndStoreBitmaskTask<P>>>,
}

impl <P: Pixel + Send + Sync> Cartographer<P>
where <P as Pixel>::Subpixel: Send + Sync {
  ///
  /// Create a new cartographer with the given storage and target. 
  /// - `storage` - the storage (e.g. database) to store the points.
  /// - `target` - the target to store the generated bitmasks.
  /// - `scheduler` - the scheduler to schedule the bitmask generation tasks.
  ///
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
