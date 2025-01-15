use image::{ imageops::crop_imm, ImageBuffer, Pixel };


pub fn crop_to_square<P: Pixel + 'static>(image: &ImageBuffer<P, Vec<<P as Pixel>::Subpixel>>)
  -> ImageBuffer<P, Vec<<P as Pixel>::Subpixel>> {
  let (width, height) = image.dimensions();
  let min_dim = width.min(height);
  let x_offset = (width - min_dim) / 2;
  let y_offset = (height - min_dim) / 2;

  crop_imm(image, x_offset, y_offset, min_dim, min_dim).to_image()
}
