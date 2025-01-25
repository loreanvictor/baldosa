use std::collections::HashMap;
use super::interface::Metadata;


///
/// Convert a metadata struct to a hashmap.
/// Returns None if the metadata is empty.
///
pub fn metadata_to_hashmap(meta: &Metadata) -> Option<HashMap<String, String>> {
  let mut map = HashMap::new();
  if let Some(title) = &meta.title { map.insert("title".to_string(), title.to_string()); }
  if let Some(subtitle) = &meta.subtitle { map.insert("subtitle".to_string(), subtitle.to_string()); }
  if let Some(link) = &meta.link { map.insert("link".to_string(), link.to_string()); }
  
  (!map.is_empty()).then_some(map)
}
