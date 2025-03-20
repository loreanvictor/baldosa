use std::collections::HashMap;
use base64::prelude::*;
use super::interface::Metadata;


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
pub fn metadata_to_hashmap(meta: &Metadata) -> Option<HashMap<String, String>> {
  let mut map = HashMap::new();
  if let Some(title) = &meta.title { map.insert("title".to_string(), title.to_string()); }
  if let Some(subtitle) = &meta.subtitle { map.insert("subtitle".to_string(), subtitle.to_string()); }
  if let Some(link) = &meta.link { map.insert("link".to_string(), link.to_string()); }
  if let Some(description) = &meta.description {
    map.insert("description".to_string(), BASE64_STANDARD.encode(description).to_string());
  }
  if let Some(details) = &meta.details {
    map.insert("details".to_string(), BASE64_STANDARD.encode(details.to_string()).to_string());
  }
  
  (!map.is_empty()).then_some(map)
}
