use chrono::{DateTime, Duration, Utc};
use dashmap::{
  mapref::entry::Entry::{Occupied, Vacant},
  DashMap,
};
use rand::{rngs::StdRng, Rng, SeedableRng};
use ring::digest;
use webauthn_rs::prelude::Uuid;

use super::super::error::AuthError;

// TODO: add these to config

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

///
/// Represents the repository for one-time codes, to be
/// used for email verification and email sign ins.
///
/// Codes are stored in memory for performance, as their loss
/// is not a security issue. The number of failed attempts
/// is tracked for each user (not per code), and if a user
/// exceeds a certain number of attempts, they are locked out for
/// a certain duration (default 5 attempts, 5 minutes).
///
/// Though this won't be an issue with in-memory storage,
/// for security reasons still only the hash of each code is stored.
/// Be sure to keep it this way even if the underlying persistence
/// mechanism is switched to a more robust solution (like db, redis, etc).
///
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

  ///
  /// Checks if the user is locked out and returns an error if so
  /// A user is locked out when they have entered the wrong code too many times,
  /// in which case they will be locked for a certain duration.
  ///
  fn check_locked(&self, user_id: &Uuid) -> Result<(), AuthError> {
    // check if we have records of failed attempts
    let Occupied(attempt) = self.attempts.entry(*user_id) else {
      // no records of failed attempts
      return Ok(());
    };

    // check if the user is locked out
    let Some(lock_until) = attempt.get().lock_until else {
      // they are not locked out
      return Ok(());
    };

    // check if lock out duration still applies
    if Utc::now() < lock_until {
      Err(AuthError::TooManyAttempts)
    } else {
      Ok(())
    }
  }

  ///
  /// Records a failed attempt for the user, and if
  /// they have failed too many times, locks them out.
  ///
  /// Returns the proper error based on user conditions:
  /// - `AuthError::TooManyAttempts` if the user has failed too many times
  /// - `AuthError::InvalidCredentials` otherwise
  ///
  fn fail_attempt(&self, user_id: &Uuid) -> AuthError {
    // get the current record of failed attempts,
    // create one if need be
    let mut attempt = self.attempts.entry(*user_id).or_insert_with(|| Attempt {
      attempts: 0,
      lock_until: None,
    });

    let attempt = attempt.value_mut();
    attempt.attempts += 1;

    // check if too many failed attempts already
    if attempt.attempts >= MAX_ATTEMPTS {
      attempt.attempts = 0;
      attempt.lock_until = Some(Utc::now() + LOCK_OUT_DURATION);

      AuthError::TooManyAttempts
    } else {
      AuthError::InvalidCredentials
    }
  }

  ///
  /// Creates a new one-time code for the user.
  /// If the user is locked out due to too many failed attempts,
  /// appropriate error is returned.
  ///
  pub fn create(&self, user_id: &Uuid, subject: &str) -> Result<String, AuthError> {
    self.check_locked(user_id)?;

    let mut rng = StdRng::from_os_rng();
    let code = format!("{:06}", rng.random_range(0..1_000_000));
    let code_hash = digest::digest(&digest::SHA256, code.as_bytes())
      .as_ref()
      .to_vec();

    let mut codes = self.codes.entry(*user_id).or_default();
    codes.push(OneTimeCode {
      code_hash,
      subject: subject.to_string(),
      expires_at: Utc::now() + chrono::Duration::minutes(15),
    });

    Ok(code)
  }

  ///
  /// Verifies a one-time code for the user.
  /// If the user is locked out due to too many failed attempts,
  /// appropriate error is returned.
  ///
  pub fn verify(&self, user_id: &Uuid, code: &str, subject: &str) -> Result<(), AuthError> {
    self.check_locked(user_id)?;

    let hash = digest::digest(&digest::SHA256, code.as_bytes())
      .as_ref()
      .to_vec();
    match self.codes.entry(*user_id) {
      Occupied(codes) => {
        for code in codes.get() {
          if code.code_hash == hash && code.subject == subject && code.expires_at > Utc::now() {
            codes.remove();
            self.attempts.remove(user_id);
            return Ok(());
          }
        }
      }
      Vacant(_) => {}
    };

    Err(self.fail_attempt(user_id))
  }
}
