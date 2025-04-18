use std::{error::Error, pin::Pin, sync::Arc};

use async_trait::async_trait;
use futures::stream::Stream;
use image::Pixel;

use super::bitmask::{
  generate::{get_chunk_coords, GenerateAndStoreBitmaskTask},
  target::BitmaskTarget,
};
use super::schedule::Scheduler;
use super::{Coords, Point, Storage};

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

impl<P: Pixel + Send + Sync> Cartographer<P>
where
  <P as Pixel>::Subpixel: Send + Sync,
{
  ///
  /// Create a new cartographer with the given storage and target.
  /// - `storage` - the storage (e.g. database) to store the points.
  /// - `target` - the target to store the generated bitmasks.
  /// - `scheduler` - the scheduler to schedule the bitmask generation tasks.
  ///
  pub fn new(
    storage: Arc<dyn Storage<P>>,
    target: Arc<dyn BitmaskTarget>,
    mut scheduler: impl Scheduler<GenerateAndStoreBitmaskTask<P>> + 'static,
  ) -> Self {
    scheduler.assign(GenerateAndStoreBitmaskTask::new(
      Arc::clone(&storage),
      target,
    ));

    Self {
      storage,
      scheduler: Box::new(scheduler),
    }
  }
}

#[async_trait]
impl<P: Pixel + Send + Sync> Storage<P> for Cartographer<P>
where
  <P as Pixel>::Subpixel: Send + Sync,
{
  async fn put(
    &self,
    coords: &Coords,
    color: &Vec<<P as Pixel>::Subpixel>,
  ) -> Result<(), Box<dyn Error + Send + Sync>> {
    match self.storage.put(coords, color).await {
      Ok(()) => {
        let anchor = get_chunk_coords(coords);
        Ok(self.scheduler.schedule(&anchor).await)
      }
      err => err,
    }
  }

  async fn delete(&self, coords: &Coords) -> Result<(), Box<dyn Error + Send + Sync>> {
    match self.storage.delete(coords).await {
      Ok(()) => {
        let anchor = get_chunk_coords(coords);
        Ok(self.scheduler.schedule(&anchor).await)
      }
      err => err,
    }
  }

  async fn get<'a>(
    &'a self,
    from: &'a Coords,
    to: &'a Coords,
  ) -> Pin<Box<dyn Stream<Item = Point<P>> + Send + 'a>> {
    self.storage.get(from, to).await
  }
}
