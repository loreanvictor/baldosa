use std::convert::TryFrom;
use std::num::ParseIntError;

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error, PartialEq)]
pub enum ParseCoordsError {
  #[error("Invalid format")]
  InvalidFormat,
  #[error("Invalid number: {0}")]
  InvalidNumber(ParseIntError),
}

///
/// Parse a path string of the form `x:y` into a tuple of integers.
///
pub fn parse_coords(path: &str) -> Result<(i32, i32), ParseCoordsError> {
  match path
    .split_once(':')
    .map(|(x, y)| (x.parse::<i32>(), y.parse::<i32>()))
  {
    Some((Ok(x), Ok(y))) => Ok((x, y)),
    Some((Err(e), _) | (_, Err(e))) => Err(ParseCoordsError::InvalidNumber(e)),
    None => Err(ParseCoordsError::InvalidFormat),
  }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Coords {
  pub x: i32,
  pub y: i32,
}

impl TryFrom<String> for Coords {
  type Error = ParseCoordsError;

  fn try_from(value: String) -> Result<Self, Self::Error> {
    let (x, y) = parse_coords(&value)?;
    Ok(Self { x, y })
  }
}

impl From<Coords> for String {
  fn from(coords: Coords) -> Self {
    format!("{}:{}", coords.x, coords.y)
  }
}

impl PartialEq for Coords {
  fn eq(&self, other: &Self) -> bool {
    self.x == other.x && self.y == other.y
  }
}
