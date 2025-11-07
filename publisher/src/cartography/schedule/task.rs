use async_trait::async_trait;

use super::super::Coords;

///
/// An async unit of work conducted on some coordinates.
///
#[async_trait]
pub trait Task: Clone + Send + Sync + 'static {
  async fn run(&self, coords: &Coords);
}
