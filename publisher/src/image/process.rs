use std::sync::Arc;
use std::{ path::Path, error::Error };
use image::{
  imageops::{ crop_imm, resize, fast_blur, FilterType },
  GenericImageView, SubImage,
};
use futures::{ future::join_all, executor::block_on };
use tokio::task::{ spawn, spawn_blocking };

use super::io::{ load_rgb as load, save_jpeg as save, JPEG_EXT as EXT };
use super::super::config::Config;


fn crop_to_square<I: GenericImageView>(image: &I) -> SubImage<&I> {
  let (width, height) = image.dimensions();
  let min_dim = width.min(height);
  let x_offset = (width - min_dim) / 2;
  let y_offset = (height - min_dim) / 2;

  crop_imm(image, x_offset, y_offset, min_dim, min_dim)
}

pub async fn process_image(
  source: &str,
  x: i32,
  y: i32,
  title: &str,
  subtitle: &str,
  link: &str,
  config: Arc<Config>,
) -> Result<(), Box<dyn Error + Send + Sync>> {
  let source = Path::new(&config.source_dir).join(&source);
  let image = load(&source).await?;
  let square = Arc::new(crop_to_square(&image).to_image());

  let mut tasks: Vec<_> = config.sizes.iter().map(|size| {
    let square = Arc::clone(&square);
    let target = Path::new(&config.target_dir)
      .join(format!("tile-{}-{}-{}", x, y, size))
      .with_extension(EXT);
    let blur_amount = match &config.blur.get(size) {
      Some(amount) => **amount,
      None => 0.0,
    };
    let size: u32 = (*size).into();

    spawn_blocking(move || {
      let resized = resize(&*square, size, size, FilterType::Lanczos3);
      let blurred = if blur_amount > 0.0 { fast_blur(&resized, blur_amount) } else { resized };
      block_on(save(&blurred, &target)).unwrap();
    })
  }).collect();

  tasks.push(spawn(async move {
    let target = Path::new(&config.target_dir)
    .join(format!("tile-{}-{}", x, y))
    .with_extension(EXT);
    save(&square, &target).await.unwrap();
  }));

  join_all(tasks).await;

  Ok(())
}
