use log::{ error, info };
use aws_config::BehaviorVersion;
use aws_sdk_s3::{ config::ProvideCredentials, Client as S3Client };


pub async fn init() -> S3Client {
  let config = aws_config::load_defaults(BehaviorVersion::latest()).await;
  let client = S3Client::new(&config);

  match (
      config.region(),
      config.credentials_provider().unwrap().provide_credentials().await
   ) {
    (Some(region), Ok(credentials)) => {
      info!("S3 client connected: {}, key id {}", region, credentials.access_key_id());
    },
    _ => {
      error!("AWS S3 not configured properly.");
      panic!("AWS S3 not configured properly.");
    },
  }

  client
}
