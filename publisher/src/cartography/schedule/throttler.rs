use async_trait::async_trait;
use std::{ sync::Arc, collections::HashMap };
use tokio::{ sync::Mutex, time::{ sleep, Duration } };

use super::super::Coords;
use super::{ Task, Scheduler };


#[derive(Debug)]
enum CoordState {
  Idle, Scheduled, Running, RunningAndScheduled,
}

pub struct Throttler<T: Task> {
  task: Option<T>,
  delay: Duration,
  states: Arc<Mutex<HashMap<Coords, CoordState>>>,
}

impl <T: Task> Throttler<T> {
  pub fn new(delay: Duration) -> Self {
    Throttler {
      task: None,
      delay,
      states: Arc::new(Mutex::new(HashMap::new())),
    }
  }

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
        let mut map = future_self.states.lock().await;
        let state = map.get_mut(&coords).unwrap();
        *state = CoordState::Running;
      }

      match &future_self.task {
        Some(task) => task.run(&coords).await,
        None => {}
      }

      let mut map = future_self.states.lock().await;
      let state = map.get_mut(&coords).unwrap();
      let reschedule = match *state {
        CoordState::RunningAndScheduled => true,
        _ => false
      };
      *state = CoordState::Idle;

      if reschedule { future_self.schedule(&coords).await; }
    });
  }
}

#[async_trait]
impl <T: Task> Scheduler<T> for Throttler<T> {
  async fn schedule(&self, coords: &Coords) {
    let mut map = self.states.lock().await;
    let entry = map.entry(*coords).or_insert(CoordState::Idle);
    match *entry {
      CoordState::Idle => {
        *entry = CoordState::Scheduled;
        drop(map);
        self.delay_and_run(coords);
      },
      CoordState::Running => *entry = CoordState::RunningAndScheduled,
      _ => {},
    }
  }

  fn assign(&mut self, task: T) {
    self.task = Some(task);
  }
}
