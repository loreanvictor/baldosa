use serde::Serialize;
use std::{ sync::Arc, collections::HashMap, error::Error, sync::Mutex as MX };
use tokio::{ task::{ spawn, spawn_blocking }, sync::Mutex };
use futures::{ future::join_all, executor::block_on };
use image::{ Rgb, Pixel, imageops::{ resize, fast_blur, FilterType }};

use super::util::crop_to_square;
use super::io::interface::{ ImageInterface, Metadata };
use super::super::config::Config;


///
/// Result of a publish operation. A publish operation results
/// in a list of image URLs (or paths), one for each produced size,
/// alongside a signature color for the tile. Alongside configured
/// sizes, a size 0 image will also be produced, which is square
/// crop of the original image.
/// 
#[derive(Serialize, Debug)]
pub struct PublishResult<P: Pixel>
where P::Subpixel: Serialize {
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
pub async fn publish<P: Pixel + Send + Sync + 'static> (
  source: &str,
  x: i32,
  y: i32,
  title: &Option<String>,
  subtitle: &Option<String>,
  link: &Option<String>,
  io: Arc<dyn ImageInterface<Pixel = P>>,
  config: Arc<Config>,
) -> Result<PublishResult<P>, Box<dyn Error + Send + Sync>>
where P::Subpixel: Send + Sync + Serialize {
  let image = io.load(&source).await?;
  let square = Arc::new(crop_to_square(&image));
  let published_shared = Arc::new(Mutex::new(HashMap::<u32, String>::new()));
  let meta = Metadata {
    title: title.clone(),
    subtitle: subtitle.clone(),
    link: link.clone(),
  };

  let color: Arc<MX<Option<Rgb<P::Subpixel>>>> = Arc::new(MX::new(None));

  // define one task for resizing and potentially blurring
  // for each defined size.
  let mut tasks: Vec<_> = config.sizes.iter().map(|size| {
    let square = Arc::clone(&square);
    let target = format!("tile-{}-{}-{}", x, y, size);
    let blur_amount = match config.blur.get(size) {
      Some(amount) => *amount,
      None => 0.0,
    };
    let size = *size;
    let published = Arc::clone(&published_shared);
    let io = Arc::clone(&io);
    let meta = meta.clone();

    let color = Arc::clone(&color);

    spawn_blocking(move || {
      let resized = resize(&*square, size, size, FilterType::Lanczos3);
      let blurred = if blur_amount > 0.0 { fast_blur(&resized, blur_amount) } else { resized };
      let saved = block_on(io.save(&blurred, &meta, &target)).unwrap();

      if size == 1 {
        let mut color = color.lock().unwrap();
        *color = Some(blurred.get_pixel(0, 0).to_rgb());
      }

      let mut published = published.blocking_lock();
      published.insert(size, saved);
    })
  }).collect();

  let published = Arc::clone(&published_shared);
  let io = Arc::clone(&io);

  // also add one task for the original size (cropped to square)
  tasks.push(spawn(async move {
    let target = format!("tile-{}-{}", x, y);
    let saved = io.save(&square, &meta, &target).await.unwrap();

    let mut published = published.lock().await;
    published.insert(0, saved);
  }));

  // TODO: better error handling here
  join_all(tasks).await;

  let color = match &*color.lock().unwrap() {
    Some(color) => Some(vec![color.0[0], color.0[1], color.0[2]]),
    None => None,
  };

  let published = published_shared.lock().await;
  Ok(PublishResult {
    color: color,
    images: published.clone(),
  })
}
