use serde::Serialize;
use std::{ sync::Arc, collections::HashMap, error::Error };
use tokio::{ task::{ spawn, spawn_blocking }, sync::Mutex };
use futures::{ future::join_all, executor::block_on };
use image::{ Pixel, imageops::{ resize, fast_blur, FilterType }};

use super::util::crop_to_square;
use super::io::interface::{ ImageInterface, Metadata };
use super::super::config::Config;


#[derive(Serialize, Debug)]
pub struct ProcessingResult {
  pub images: HashMap<u32, String>,
}

pub async fn publish<P: Pixel + Send + Sync + 'static> (
  source: &str,
  x: i32,
  y: i32,
  title: &str,
  subtitle: &str,
  link: &str,
  io: Arc<dyn ImageInterface<Pixel = P>>,
  config: Arc<Config>,
) -> Result<ProcessingResult, Box<dyn Error + Send + Sync>>
where P::Subpixel: Send + Sync {
  let image = io.load(&source).await?;
  let square = Arc::new(crop_to_square(&image));
  let processed_shared = Arc::new(Mutex::new(HashMap::<u32, String>::new()));
  let meta = Metadata {
    title: title.to_string(),
    subtitle: subtitle.to_string(),
    link: link.to_string(),
  };

  let mut tasks: Vec<_> = config.sizes.iter().map(|size| {
    let square = Arc::clone(&square);
    let target = format!("tile-{}-{}-{}", x, y, size);
    let blur_amount = match &config.blur.get(size) {
      Some(amount) => **amount,
      None => 0.0,
    };
    let size = *size;
    let processed = Arc::clone(&processed_shared);
    let io = Arc::clone(&io);
    let meta = meta.clone();

    spawn_blocking(move || {
      let resized = resize(&*square, size, size, FilterType::Lanczos3);
      let blurred = if blur_amount > 0.0 { fast_blur(&resized, blur_amount) } else { resized };
      let saved = block_on(io.save(&blurred, &meta, &target)).unwrap();

      let mut processed = processed.blocking_lock();
      processed.insert(size, saved);
    })
  }).collect();

  let processed = Arc::clone(&processed_shared);
  let io = Arc::clone(&io);

  tasks.push(spawn(async move {
    let target = format!("tile-{}-{}", x, y);
    let saved = io.save(&square, &meta, &target).await.unwrap();

    let mut processed = processed.lock().await;
    processed.insert(0, saved);
  }));

  // TODO: better error handling here
  join_all(tasks).await;

  let processed = processed_shared.lock().await;
  Ok(ProcessingResult {
    images: processed.clone(),
  })
}
