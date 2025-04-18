use std::num::ParseIntError;

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
    Some((Err(e), _)) => Err(ParseCoordsError::InvalidNumber(e)),
    Some((_, Err(e))) => Err(ParseCoordsError::InvalidNumber(e)),
    None => Err(ParseCoordsError::InvalidFormat),
  }
}

#[derive(Debug, Error)]
pub enum ParseNumWithUnitError {
  #[error("Unknown unit")]
  UnknownUnit,
  #[error("Invalid number: {0}")]
  InvalidNumber(ParseIntError),
}

fn parse_num_with_unit<const N: usize>(
  text: &str,
  units: [(&str, u32); N],
) -> Result<u32, ParseNumWithUnitError> {
  let input = text.trim().to_lowercase();
  for (suffix, factor) in units {
    if let Some(num) = input.strip_suffix(suffix) {
      let num: u32 = num
        .trim()
        .parse()
        .map_err(|e| ParseNumWithUnitError::InvalidNumber(e))?;
      return Ok(num * factor);
    }
  }

  Err(ParseNumWithUnitError::UnknownUnit)
}

///
/// Parse a human readable file size string
///
pub fn parse_file_size(text: &str) -> Result<u32, ParseNumWithUnitError> {
  const SIZE_UNITS: [(&str, u32); 7] = [
    ("kib", 1 << 10),
    ("mib", 1 << 20),
    ("gib", 1 << 30),
    ("kb", 1_000),
    ("mb", 1_000_000),
    ("gb", 1_000_000_000),
    ("b", 1),
  ];

  parse_num_with_unit(text, SIZE_UNITS)
}

///
/// Parse a human readable time duration string
///
pub fn parse_time_duration(text: &str) -> Result<u32, ParseNumWithUnitError> {
  const TIME_UNITS: [(&str, u32); 14] = [
    ("s", 1),
    ("sec", 1),
    ("second", 1),
    ("seconds", 1),
    ("m", 60),
    ("min", 60),
    ("minute", 60),
    ("minutes", 60),
    ("h", 60 * 60),
    ("hour", 60 * 60),
    ("hours", 60 * 60),
    ("d", 60 * 60 * 24),
    ("day", 60 * 60 * 24),
    ("days", 60 * 60 * 24),
  ];

  parse_num_with_unit(text, TIME_UNITS)
}
