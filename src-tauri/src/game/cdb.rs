mod async_db;
mod sync_db;

use std::{collections::BTreeMap, path::Path};
use serde::Serialize;
use anyhow::{Result, Error};

#[derive(Serialize, Clone, Debug)]
pub struct Cdb {
	content: BTreeMap<u32, (Vec<u32>, Vec<String>)>
}

impl Cdb  {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub async fn init<P: AsRef<Path>> (&mut self, path: P) -> Result<(), Error> {
		async_db::init(path).await?.into_iter().for_each(move |i| {
			self.content.insert(i.0, i.1);
		});
		Ok(())
	}
	pub fn init_by_buffer (&mut self, data: Vec<u8>) -> Result<(), Error> {
		sync_db::init(data)?.into_iter().for_each(|i: (u32, (Vec<u32>, Vec<String>))| {
			self.content.insert(i.0, i.1);
		});
		Ok(())
	}
	pub fn init_by_db (&mut self, db: Cdb) -> () {
		db.to_array().into_iter().for_each(|i: (Vec<u32>, Vec<String>)| {
			self.content.insert(i.0[0], i);
		});
	}
	pub fn to_array (&self) -> Vec<(Vec<u32>, Vec<String>)> {
		self.content.values().cloned().collect()
	}
	pub fn content (&self) -> &BTreeMap<u32, (Vec<u32>, Vec<String>)> {
		&self.content
	}
}