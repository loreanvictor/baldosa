use chrono::{DateTime, Duration, Utc};
use dashmap::{
  mapref::entry::Entry::{Occupied, Vacant},
  DashMap,
};
use rand::{rngs::StdRng, Rng, SeedableRng};
use ring::digest;
use webauthn_rs::prelude::Uuid;

use super::super::error::AuthError;

const MAX_ATTEMPTS: u32 = 5;
const LOCK_OUT_DURATION: Duration = Duration::minutes(5);

#[derive(Debug, Clone)]
struct OneTimeCode {
  code_hash: Vec<u8>,
  subject: String,
  expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
struct Attempt {
  attempts: u32,
  lock_until: Option<DateTime<Utc>>,
}

#[derive(Clone)]
pub struct CodesRepository {
  codes: DashMap<Uuid, Vec<OneTimeCode>>,
  attempts: DashMap<Uuid, Attempt>,
}

impl CodesRepository {
  pub fn new() -> Self {
    Self {
      codes: DashMap::new(),
      attempts: DashMap::new(),
    }
  }

  async fn check_locked(&self, user_id: &Uuid) -> Result<(), AuthError> {
    let attempt = match self.attempts.entry(*user_id) {
      Occupied(attempt) => attempt,
      Vacant(_) => return Ok(()),
    };

    match attempt.get().lock_until {
      Some(lock_until) => {
        if Utc::now() < lock_until {
          Err(AuthError::TooManyAttempts)
        } else {
          Ok(())
        }
      }
      None => Ok(()),
    }
  }

  async fn fail_attempt(&self, user_id: &Uuid) -> AuthError {
    let mut attempt = self.attempts.entry(*user_id).or_insert_with(|| Attempt {
      attempts: 0,
      lock_until: None,
    });

    let attempt = attempt.value_mut();
    attempt.attempts += 1;
    if attempt.attempts >= MAX_ATTEMPTS {
      attempt.attempts = 0;
      attempt.lock_until = Some(Utc::now() + LOCK_OUT_DURATION);

      AuthError::TooManyAttempts
    } else {
      AuthError::InvalidCredentials
    }
  }

  pub async fn create(&self, user_id: &Uuid, subject: &str) -> Result<String, AuthError> {
    match self.check_locked(user_id).await {
      Ok(()) => {}
      Err(err) => {
        return Err(err);
      }
    };

    let mut rng = StdRng::from_os_rng();
    let code = format!("{:06}", rng.random_range(0..1_000_000));
    let code_hash = digest::digest(&digest::SHA256, &code.as_bytes())
      .as_ref()
      .to_vec();

    let mut codes = self.codes.entry(*user_id).or_insert(Vec::new());
    codes.push(OneTimeCode {
      code_hash,
      subject: subject.to_string(),
      expires_at: Utc::now() + chrono::Duration::minutes(15),
    });

    Ok(code)
  }

  pub async fn verify(&self, user_id: &Uuid, code: &str, subject: &str) -> Result<(), AuthError> {
    match self.check_locked(user_id).await {
      Ok(()) => {}
      Err(err) => {
        return Err(err);
      }
    };

    let hash = digest::digest(&digest::SHA256, &code.as_bytes())
      .as_ref()
      .to_vec();
    match self.codes.entry(*user_id) {
      Occupied(codes) => {
        for code in codes.get().iter() {
          if code.code_hash == hash && code.subject == subject && code.expires_at > Utc::now() {
            codes.remove();
            self.attempts.remove(user_id);
            return Ok(());
          }
        }
      }
      Vacant(_) => {}
    };

    Err(self.fail_attempt(user_id).await)
  }
}
