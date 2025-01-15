use async_trait::async_trait;
use std::{ path::Path, io::Cursor, error::Error, sync::Arc };
use tokio::{ fs::{ read, File }, io::AsyncWriteExt };
use image:: { Rgb, RgbImage, load_from_memory, ImageFormat::Jpeg };
use log::warn;

use super::super::super::config::Config;
use super::interface::{ ImageInterface, Metadata };


pub struct FsJpegInterface {
  config: Arc<Config>
}


impl FsJpegInterface {
  #[allow(dead_code)]
  pub fn new(config: Arc<Config>) -> Self {
    Self { config }
  }
}


#[async_trait]
impl ImageInterface for FsJpegInterface {
  type Pixel = Rgb<u8>;

  async fn load(&self, source: &str) -> Result<RgbImage, Box<dyn Error + Send + Sync>> {
    let path = Path::new(&self.config.source_dir).join(source);
    let file = read(path).await?;
    let img = load_from_memory(&file)?;
    let rgb = img.into_rgb8();

    Ok(rgb)
  }

  async fn save(
    &self,
    image: &RgbImage,
    _meta: &Metadata,
    target: &str
  ) -> Result<String, Box<dyn Error + Send + Sync>> {
    let path = Path::new(&self.config.target_dir).join(target).with_extension("jpg");
    let mut target = File::create(&path).await?;
    let mut buffer = Vec::new();
    image.write_to(&mut Cursor::new(&mut buffer), Jpeg)?;
    target.write_all(&buffer).await?;

    warn!("Metadata not supported, skipped for {}", &path.display());

    Ok(path.display().to_string())
  }
}
