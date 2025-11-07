use std::{collections::HashMap, sync::Arc};

use async_trait::async_trait;
use tokio::{
  sync::Mutex,
  time::{sleep, Duration},
};

use super::super::Coords;
use super::{Scheduler, Task};

#[derive(Debug)]
enum CoordState {
  Idle,
  Scheduled,
  Running,
  RunningAndScheduled,
}

///
/// A scheduler that controls the rate of task execution using a delay mechanism.
/// It ensures that concurrent requests for the same coordinates are properly batched
/// and executed with a minimum time interval between them.
///
/// For each scheduled request on a specific coordinate, the scheduler will:
/// - delay the execution by given duration.
/// - ignore other incoming requests for the coordinate, to ensure the task executes once
///   after the delay,
/// - if there are incoming requests for a specific coordinate while executing the task on that coordinate,
///   schedules another delay + execution after current execution is finished.
///
pub struct Throttler<T: Task> {
  task: Option<T>,
  delay: Duration,
  states: Arc<Mutex<HashMap<Coords, CoordState>>>,
}

impl<T: Task> Throttler<T> {
  ///
  /// Creates a new throttler with the given delay.
  /// The delay is the minimum time interval between two consecutive executions of the task on the same coordinates.
  ///
  pub fn new(delay: Duration) -> Self {
    Throttler {
      task: None,
      delay,
      states: Arc::new(Mutex::new(HashMap::new())),
    }
  }

  //
  // Delay the execution of the task and run it.
  //
  fn delay_and_run(&self, coords: &Coords) {
    let coords = *coords;
    let future_self = Self {
      task: self.task.clone(),
      delay: self.delay,
      states: Arc::clone(&self.states),
    };

    tokio::spawn(async move {
      sleep(future_self.delay).await;
      {
        //
        // update the state to Running
        //

        let mut map = future_self.states.lock().await;
        let state = map.get_mut(&coords).unwrap();
        *state = CoordState::Running;
      }

      //
      // run the task (if assigned)
      //
      match &future_self.task {
        Some(task) => task.run(&coords).await,
        None => {}
      }

      //
      // check if we should schedule another one
      // now that the previous execution is finished
      //
      let mut map = future_self.states.lock().await;
      let state = map.get_mut(&coords).unwrap();
      let reschedule = match *state {
        CoordState::RunningAndScheduled => true,
        _ => false,
      };
      *state = CoordState::Idle;

      if reschedule {
        future_self.schedule(&coords).await;
      }
    });
  }
}

#[async_trait]
impl<T: Task> Scheduler<T> for Throttler<T> {
  ///
  /// Schedules a task for execution on the given coordinates.
  /// If there is already a task scheduled for the same coordinates, it will be ignored.
  /// If there is a task running for the same coordinates, the new task will be scheduled
  /// to run after the current task is finished.
  ///
  async fn schedule(&self, coords: &Coords) {
    let mut map = self.states.lock().await;
    let entry = map.entry(*coords).or_insert(CoordState::Idle);

    //
    // check the state of the task execution on given coordinates
    //
    match *entry {
      //
      // no task scheduled or running, schedule the task
      //
      CoordState::Idle => {
        *entry = CoordState::Scheduled;
        drop(map);
        self.delay_and_run(coords);
      }
      //
      // task is running, schedule the task after the current task is finished
      //
      CoordState::Running => *entry = CoordState::RunningAndScheduled,
      //
      // ignore the rest
      //
      _ => {}
    }
  }

  fn assign(&mut self, task: T) {
    self.task = Some(task);
  }
}
