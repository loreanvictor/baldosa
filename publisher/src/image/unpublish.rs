use std::{collections::HashMap, sync::Arc};

use futures::future::join_all;
use image::Pixel;
use serde::Serialize;
use tokio::{sync::Mutex, task::spawn};

use super::super::config::Config;
use super::io::error::ImageIoError;
use super::io::interface::ImageInterface;

///
/// Result of the unpublish operation. Unpublishing a tile
/// will cause the associated images for that tile to be removed.
///
#[derive(Serialize, Debug)]
pub struct UnPublishResult {
  /// Map of image sizes to the image addresses that was removed.
  pub images: HashMap<u32, String>,
}

///
/// Unpublish the tile at the given coordinates,
/// removing all associated images.
///
pub async fn unpublish<P: Pixel + Send + Sync + 'static>(
  x: i32,
  y: i32,
  io: Arc<dyn ImageInterface<Pixel = P>>,
  config: Arc<Config>,
) -> Result<UnPublishResult, ImageIoError>
where
  P::Subpixel: Send + Sync,
{
  let unpublished_shared = Arc::new(Mutex::new(HashMap::<u32, String>::new()));

  let mut tasks: Vec<_> = config
    .sizes
    .iter()
    .map(|size| {
      let target = format!("tile-{}-{}-{}", x, y, size);
      let unpublished = Arc::clone(&unpublished_shared);
      let io = Arc::clone(&io);
      let size = *size;

      spawn(async move {
        let deleted = io.delete(&target).await.unwrap();
        let mut unpublished = unpublished.lock().await;
        unpublished.insert(size, deleted);
      })
    })
    .collect();

  let unpublished = Arc::clone(&unpublished_shared);
  let io = Arc::clone(&io);

  tasks.push(spawn(async move {
    let target = format!("tile-{}-{}", x, y);
    let deleted = io.delete(&target).await.unwrap();

    let mut unpublished = unpublished.lock().await;
    unpublished.insert(0, deleted);
  }));

  join_all(tasks).await;

  let unpublished = unpublished_shared.lock().await;
  Ok(UnPublishResult {
    images: unpublished.clone(),
  })
}
