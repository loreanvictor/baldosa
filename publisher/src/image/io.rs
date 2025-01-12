use image::{ load_from_memory, ImageFormat::{ Jpeg, Png }, RgbImage, RgbaImage };
use std::{ io::Cursor, path::Path, error::Error };
use tokio::{ fs::{ read, File }, io::AsyncWriteExt };


#[allow(dead_code)]
pub const JPEG_EXT: &str = "jpg";

#[allow(dead_code)]
pub const PNG_EXT: &str = "png";


#[allow(dead_code)]
pub async fn load_rgb(src: &Path) -> Result<RgbImage, Box<dyn Error + Send + Sync>> {
  let file = read(src).await?;
  let img = load_from_memory(&file)?;
  let rgb = img.into_rgb8();

  Ok(rgb)
}

#[allow(dead_code)]
pub async fn load_rgba(src: &Path) -> Result<RgbaImage, Box<dyn Error + Send + Sync>> {
  let file = read(src).await?;
  let img = load_from_memory(&file)?;
  let rgba = img.into_rgba8();

  Ok(rgba)
}


#[allow(dead_code)]
pub async fn save_jpeg(
  image: &RgbImage,
  target: &Path,
) -> Result<(), Box<dyn Error + Send + Sync>> {
  let mut target = File::create(target).await?;
  let mut buffer = Vec::new();
  image.write_to(&mut Cursor::new(&mut buffer), Jpeg)?;
  target.write_all(&buffer).await?;

  Ok(())
}

#[allow(dead_code)]
pub async fn save_png(
  image: &RgbaImage,
  target: &Path,
) -> Result<(), Box<dyn Error + Send + Sync>> {
  let mut target = File::create(target).await?;
  let mut buffer = Vec::new();
  image.write_to(&mut Cursor::new(&mut buffer), Png)?;
  target.write_all(&buffer).await?;

  Ok(())
}

