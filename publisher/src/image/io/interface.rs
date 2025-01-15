use async_trait::async_trait;
use image::{ ImageBuffer, Pixel };


#[derive(Debug, Clone)]
pub struct Metadata {
  pub title: String,
  pub subtitle: String,
  pub link: String,
}


#[async_trait]
pub trait ImageInterface: Sync + Send {
  type Pixel: Pixel + Send + Sync;

  async fn load(&self, source: &str)
    -> Result<
      ImageBuffer<Self::Pixel, Vec<<Self::Pixel as Pixel>::Subpixel>>,
      Box<dyn std::error::Error + Send + Sync>
    >;
  async fn save(
    &self,
    image: &ImageBuffer<Self::Pixel, Vec<<Self::Pixel as Pixel>::Subpixel>>,
    meta: &Metadata,
    target: &str
  ) -> Result<String, Box<dyn std::error::Error + Send + Sync>>;
}
