use async_trait::async_trait;

use super::super::Coords;
use super::Task;


///
/// A scheduler can schedule execution of an assigned task
/// on a given coordinate. The scheduler needs to have the general task assigned first,
/// then it will schedule executions of given task on requested coordinates based on
/// its scheduling logic.
///
#[async_trait]
pub trait Scheduler<T: Task>: Send + Sync {
  ///
  /// Requests a scheduled execution of the scheduler's task
  /// for given coordinates.
  ///
  async fn schedule(&self, coords: &Coords);

  ///
  /// Assigns a task to this scheduler.
  ///
  fn assign(&mut self, task: T);
}
