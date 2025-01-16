use async_trait::async_trait;
use std::{ env, path::Path, io::Cursor, error::Error };
use tokio::{ fs::{ read, remove_file, File }, io::AsyncWriteExt };
use image:: { Rgba, RgbaImage, load_from_memory, ImageFormat::Png };
use log::warn;

use super::interface::{ ImageInterface, Metadata };


pub struct FsPngInterface {
  source_dir: String,
  target_dir: String,
}


impl FsPngInterface {
  #[allow(dead_code)]
  pub fn new(source_dir: Option<String>, target_dir: Option<String>) -> Self {
    Self {
      source_dir: source_dir.unwrap_or_else(
        || env::var("SOURCE_DIR")
          .expect("Source directory not specified for FS PNG interface.")
      ),
      target_dir: target_dir.unwrap_or_else(
        || env::var("TARGET_DIR")
          .expect("Target directory not specified for FS PNG interface.")
      ),
    }
  }
}


#[async_trait]
impl ImageInterface for FsPngInterface {
  type Pixel = Rgba<u8>;
  async fn load(&self, source: &str) -> Result<RgbaImage, Box<dyn Error + Send + Sync>> {
    let path = Path::new(&self.source_dir).join(source);
    let file = read(path).await?;
    let img = load_from_memory(&file)?;
    let rgba = img.into_rgba8();

    Ok(rgba)
  }

  async fn save(
    &self,
    image: &RgbaImage,
    _meta: &Metadata,
    target: &str
  ) -> Result<String, Box<dyn Error + Send + Sync>> {
    let path = Path::new(&self.target_dir).join(target).with_extension("png");
    let mut target = File::create(&path).await?;
    let mut buffer = Vec::new();
    image.write_to(&mut Cursor::new(&mut buffer), Png)?;
    target.write_all(&buffer).await?;

    warn!("Metadata not supported, skipped for {}", &path.display());

    Ok(path.display().to_string())
  }

  async fn delete(&self, source: &str) -> Result<String, Box<dyn Error + Send + Sync>> {
    let path = Path::new(&self.target_dir).join(source).with_extension("png");
    remove_file(&path).await?;

    Ok(path.display().to_string())
  }
}
