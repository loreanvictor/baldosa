use async_trait::async_trait;

use super::super::Coords;
use super::Task;


#[async_trait]
pub trait Scheduler<T: Task>: Send + Sync {
  async fn schedule(&self, coords: &Coords);
  fn assign(&mut self, task: T);
}
