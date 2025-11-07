use std::{collections::HashMap, error::Error, sync::Arc};

use futures::future::try_join_all;
use image::{
  imageops::{fast_blur, resize, FilterType},
  Pixel, Rgb,
};
use serde::Serialize;
use tokio::{
  sync::Mutex,
  task::{spawn, spawn_blocking},
};

use super::super::config::Config;
use super::io::interface::{ImageInterface, Metadata};
use super::util::crop_to_square;

///
/// Result of a publish operation. A publish operation results
/// in a list of image URLs (or paths), one for each produced size,
/// alongside a signature color for the tile. Alongside configured
/// sizes, a size 0 image will also be produced, which is square
/// crop of the original image.
///
#[derive(Serialize, Debug)]
pub struct PublishResult<P: Pixel>
where
  P::Subpixel: Serialize,
{
  /// The color of the tile.
  pub color: Option<Vec<P::Subpixel>>,

  /// The list of image addresses, one for each produced size.
  pub images: HashMap<u32, String>,
}

///
/// Publish given image (addressed at `source`) to the given tile (`x,y`).
/// Crops the image to a square, resizes it to various given sizes (configured via `config`),
/// and potentially blurs some of these sizes (again configured via `config`). Will then
/// store the unscaled square cropped image, alongside other sizes, to addresses associated
/// with the given coordinates. Also attaches the given metadata (`title`, `subtitle` and `link`)
/// to all produced images (subject to support by the given `io` implementation).
///
pub async fn publish<P: Pixel + Send + Sync + 'static>(
  source: &str,
  x: i32,
  y: i32,
  title: &Option<String>,
  subtitle: &Option<String>,
  description: &Option<String>,
  link: &Option<String>,
  details: &Option<serde_json::Value>,
  io: Arc<dyn ImageInterface<Pixel = P>>,
  config: Arc<Config>,
) -> Result<PublishResult<P>, Box<dyn Error + Send + Sync>>
where
  P::Subpixel: Send + Sync + Serialize,
{
  // Load and crop the image once
  let image = io.load(source).await?;
  let square = Arc::new(crop_to_square(&image));

  // Shared state for results
  let published_shared = Arc::new(Mutex::new(HashMap::<u32, String>::new()));
  let color_shared = Arc::new(Mutex::new(None::<Rgb<P::Subpixel>>));

  // Share metadata across tasks without cloning per task
  let meta = Arc::new(Metadata {
    title: title.clone(),
    subtitle: subtitle.clone(),
    description: description.clone(),
    link: link.clone(),
    details: details.clone(),
  });

  let mut handles = Vec::new();

  // Process each size: CPU-bound work in spawn_blocking, I/O in async
  for size in &config.sizes {
    let square = Arc::clone(&square);
    let target = format!("tile-{}-{}-{}", x, y, size);
    let blur_amount = config.blur.get(size).cloned().unwrap_or(0.0);
    let size = *size;
    let io = Arc::clone(&io);
    let meta = Arc::clone(&meta);
    let published = Arc::clone(&published_shared);
    let color_shared = Arc::clone(&color_shared);

    let handle = spawn_blocking(move || {
      let resized = resize(&*square, size, size, FilterType::Lanczos3);
      let blurred = if blur_amount > 0.0 {
        fast_blur(&resized, blur_amount)
      } else {
        resized
      };
      let color = if size == 1 {
        Some(blurred.get_pixel(0, 0).to_rgb())
      } else {
        None
      };
      (blurred, target, meta, color)
    });

    handles.push(spawn(async move {
      let (image, target, meta, color) = handle.await.unwrap();
      if let Some(color) = color {
        *color_shared.lock().await = Some(color);
      }

      match io.save(&image, &meta, &target).await {
        Ok(saved) => {
          published.lock().await.insert(size, saved);
          Ok(())
        }
        Err(e) => Err(e),
      }
    }));
  }

  // Handle the original square image asynchronously
  let target = format!("tile-{}-{}", x, y);
  let io = Arc::clone(&io);
  let meta = Arc::clone(&meta);
  let published = Arc::clone(&published_shared);
  let original_handle = spawn(async move {
    match io.save(&square, &meta, &target).await {
      Ok(saved) => {
        published.lock().await.insert(0, saved);
        Ok(())
      }
      Err(e) => Err(e),
    }
  });
  handles.push(original_handle);

  // Wait for all tasks to complete
  match try_join_all(handles).await {
    Ok(res) => {
      // Check for errors
      for r in res {
        r?;
      }
      // Prepare the result
      let color = color_shared.lock().await;
      let color = match &*color {
        Some(color) => Some(vec![color.0[0], color.0[1], color.0[2]]),
        None => None,
      };
      let published = published_shared.lock().await;

      Ok(PublishResult {
        color,
        images: published.clone(),
      })
    }
    Err(e) => Err(e.into()),
  }
}
