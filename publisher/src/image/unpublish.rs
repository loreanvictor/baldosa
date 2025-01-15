use serde::Serialize;
use std::{ sync::Arc, collections::HashMap, error::Error };
use tokio::{ task::spawn, sync::Mutex };
use futures::future::join_all;
use image::Pixel;

use super::io::interface::ImageInterface;
use super::super::config::Config;


#[derive(Serialize, Debug)]
pub struct UnPublishResult {
  pub images: HashMap<u32, String>,
}


pub async fn unpublish<P: Pixel + Send + Sync + 'static>(
  x: i32,
  y: i32,
  io: Arc<dyn ImageInterface<Pixel = P>>,
  config: Arc<Config>,
) -> Result<UnPublishResult, Box<dyn Error + Send + Sync>>
  where P::Subpixel: Send + Sync {
  let unpublished_shared = Arc::new(Mutex::new(HashMap::<u32, String>::new()));

  let mut tasks: Vec<_> = config.sizes.iter().map(|size| {
    let target = format!("tile-{}-{}-{}", x, y, size);
    let unpublished = Arc::clone(&unpublished_shared);
    let io = Arc::clone(&io);
    let size = *size;

    spawn(async move {
      let deleted = io.delete(&target).await.unwrap();
      let mut unpublished = unpublished.lock().await;
      unpublished.insert(size, deleted);
    })
  }).collect();

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
