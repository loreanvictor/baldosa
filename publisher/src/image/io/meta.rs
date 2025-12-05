use base64::prelude::*;
use serde::Serialize;
use std::collections::HashMap;
use std::fmt::{self, Display};
use thiserror::Error;

///
/// Metadata for an image.
///
#[derive(Debug, Clone)]
pub struct Metadata {
  /// Title of the image.
  pub title: Option<String>,
  /// Subtitle of the image (typically displayed under the title)
  pub subtitle: Option<String>,
  /// the URL that corresponding tiles should point to.
  pub link: Option<String>,
  /// Description of the image.
  pub description: Option<String>,
  /// Details of the image.
  pub details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Error)]
pub enum MetadataErrorKind {
  #[error("value is too long")]
  TooLong,
  #[error("invalid URL")]
  InvalidUrl,
}

#[derive(Debug, Clone, Serialize)]
pub struct MetadataValidationErrors {
  pub title: Option<MetadataErrorKind>,
  pub subtitle: Option<MetadataErrorKind>,
  pub link: Option<MetadataErrorKind>,
  pub description: Option<MetadataErrorKind>,
  pub details: Option<MetadataErrorKind>,
}

impl MetadataValidationErrors {
  pub fn is_empty(&self) -> bool {
    self.title.is_none()
      && self.subtitle.is_none()
      && self.link.is_none()
      && self.description.is_none()
      && self.details.is_none()
  }
}

impl Display for MetadataValidationErrors {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let mut first = true;

    let mut write_err = |field: &str, err: &Option<MetadataErrorKind>| -> fmt::Result {
      if let Some(e) = err {
        if !first {
          write!(f, "; ")?;
        }
        first = false;
        write!(f, "{}: {}", field, e)?;
      }
      Ok(())
    };

    write_err("title", &self.title)?;
    write_err("subtitle", &self.subtitle)?;
    write_err("link", &self.link)?;
    write_err("description", &self.description)?;
    write_err("details", &self.details)?;

    if first {
      write!(f, "no validation errors")
    } else {
      Ok(())
    }
  }
}

pub const MAX_TITLE_LEN: usize = 100;
pub const MAX_SUBTITLE_LEN: usize = 200;
pub const MAX_LINK_LEN: usize = 500;
pub const MAX_DESCRIPTION_LEN: usize = 900;
pub const MAX_DETAILS_JSON_LEN: usize = 300;

impl Metadata {
  pub fn validate(&self) -> Result<(), MetadataValidationErrors> {
    let mut errs = MetadataValidationErrors {
      title: None,
      subtitle: None,
      link: None,
      description: None,
      details: None,
    };

    if let Some(t) = &self.title {
      if t.len() > MAX_TITLE_LEN {
        errs.title = Some(MetadataErrorKind::TooLong);
      }
    }

    if let Some(s) = &self.subtitle {
      if s.len() > MAX_SUBTITLE_LEN {
        errs.subtitle = Some(MetadataErrorKind::TooLong);
      }
    }

    if let Some(l) = &self.link {
      if l.len() > MAX_LINK_LEN {
        errs.link = Some(MetadataErrorKind::TooLong);
      } else if url::Url::parse(l).is_err() {
        errs.link = Some(MetadataErrorKind::InvalidUrl);
      }
    }

    if let Some(d) = &self.description {
      if d.len() > MAX_DESCRIPTION_LEN {
        errs.description = Some(MetadataErrorKind::TooLong);
      }
    }

    if let Some(details) = &self.details {
      let json = serde_json::to_string(details).unwrap();
      if json.len() > MAX_DETAILS_JSON_LEN {
        errs.details = Some(MetadataErrorKind::TooLong);
      }
    }

    if errs.is_empty() {
      Ok(())
    } else {
      Err(errs)
    }
  }

  ///
  /// Convert a metadata struct to a hashmap.
  /// Returns None if the metadata is empty.
  ///
  /// Will encode the description and details in base64, since AWS does not support
  /// newline character in metadata.
  ///
  /// # Example
  /// ```
  /// let meta = Metadata {
  ///   title: Some("title".to_string()),
  ///   subtitle: Some("subtitle".to_string()),
  ///   link: Some("link".to_string()),
  ///   description: Some("description".to_string()),
  ///   details: Some(serde_json::json!({ "key": "value" })),
  /// };
  ///
  /// let map = metadata_to_hashmap(&meta);
  ///
  /// assert_eq!(map.unwrap().len(), 5);
  /// assert_eq!(map.unwrap().get("title"), Some(&"title".to_string()));
  /// assert_eq!(map.unwrap().get("description"), Some(&"ZGF0YQ==".to_string()));
  /// ```
  ///
  pub fn to_hashmap(&self) -> Result<Option<HashMap<String, String>>, MetadataValidationErrors> {
    self.validate()?;

    let mut map = HashMap::new();
    if let Some(title) = &self.title {
      map.insert("title".to_string(), title.to_string());
    }
    if let Some(subtitle) = &self.subtitle {
      map.insert("subtitle".to_string(), subtitle.to_string());
    }
    if let Some(link) = &self.link {
      map.insert("link".to_string(), link.to_string());
    }
    if let Some(description) = &self.description {
      map.insert(
        "description".to_string(),
        BASE64_STANDARD.encode(description).to_string(),
      );
    }
    if let Some(details) = &self.details {
      map.insert(
        "details".to_string(),
        BASE64_STANDARD.encode(details.to_string()).to_string(),
      );
    }

    Ok((!map.is_empty()).then_some(map))
  }
}
