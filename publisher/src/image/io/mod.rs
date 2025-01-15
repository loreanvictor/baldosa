pub mod interface;

mod fs_jpeg;
mod fs_png;
mod s3_jpeg;

#[allow(unused_imports)]
pub use fs_jpeg::FsJpegInterface;

#[allow(unused_imports)]
pub use fs_png::FsPngInterface;

#[allow(unused_imports)]
pub use s3_jpeg::S3JpegInterface;
