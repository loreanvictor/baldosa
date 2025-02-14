use async_trait::async_trait;

use super::super::Coords;


#[async_trait]
pub trait Task: Clone + Send + Sync + 'static {
  async fn run(&self, coords: &Coords);
}
