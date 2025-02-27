use async_trait::async_trait;
use futures::stream::{ Stream, StreamExt };
use std::{ error::Error, pin::Pin };
use image::Rgb;
use sqlx::{ Pool, Sqlite };

use super::{ Storage, Coords, Point };

///
/// A map storage implementation using SQLite. A stored map is an infinite grid
/// of potentially existing points. The map storage is used for storing and updating
/// chunked bitmasks of the tile map, with each published tile corresponding to a single
/// point on the map.
///
pub struct SqliteMapStorage {
  pool: Pool<Sqlite>
}

impl SqliteMapStorage {
  #[allow(dead_code)]
  pub fn new(pool: Pool<Sqlite>) -> Self {
    Self { pool }
  }
}

#[async_trait]
impl Storage<Rgb<u8>> for SqliteMapStorage {
  async fn put(
    &self,
    coords: &Coords,
    rgb: &Vec<u8>
  ) -> Result<(), Box<dyn Error + Send + Sync>> {
    let hex = format!("#{:02X}{:02X}{:02X}", rgb[0], rgb[1], rgb[2]);
    match sqlx::query!("
      insert into tiles (x, y, color_hex) values (?, ?, ?)
      on conflict (x, y) do update set color_hex = excluded.color_hex
      ", coords.0, coords.1, hex)
      .execute(&self.pool)
      .await {
        Ok(_) => Ok(()),
        Err(e) => Err(e.into())
      }
  }

  async fn delete(&self, coords: &Coords)
    -> Result<(), Box<dyn Error + Send + Sync>> {
      match sqlx::query!("delete from tiles where x = ? and y = ?", coords.0, coords.1)
        .execute(&self.pool)
        .await {
        Ok(_) => Ok(()),
        Err(e) => Err(e.into())
      }
  }

  async fn get<'a>(&'a self, from: &'a Coords, to: &'a Coords)
    -> Pin<Box<dyn Stream<Item = Point<Rgb<u8>>> + Send + 'a>> {
      Box::pin(sqlx::query!("
          select x, y, color_hex from tiles
            where x >=? and x <=?
            and y >=? and y <=?",
            from.0, to.0, from.1, to.1
        )
        .fetch(&self.pool)
        .map(|row| {
          let row = row.unwrap();
          let coords = (row.x as i32, row.y as i32);
          let mut hex = row.color_hex.chars();
          hex.next();
          let rgb = hex::decode(hex.as_str()).unwrap();

          Point { coords, color: rgb }
        })
      )
  }
}
