use std::{collections::BTreeMap, path::Path};
use serde::Serialize;
use anyhow::{Result, Error};
use ygopro_cdb_reader::{buffer, path};

#[derive(Serialize, Clone, Debug)]
pub struct Cdb {
	content: BTreeMap<u32, (Vec<i64>, Vec<String>)>
}

impl Cdb  {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub async fn init<P: AsRef<Path>> (&mut self, p: P) -> Result<(), Error> {
		path(p).await?.into_iter().for_each(move |i: (u32, (Vec<i64>, Vec<String>))| {
			self.content.insert(i.0, i.1);
		});
		Ok(())
	}
	pub fn init_by_buffer (&mut self, data: Vec<u8>) -> Result<(), Error> {
		buffer(data)?.into_iter().for_each(|i: (u32, (Vec<i64>, Vec<String>))| {
			self.content.insert(i.0, i.1);
		});
		Ok(())
	}
	pub fn init_by_db (&mut self, db: Cdb) -> () {
		db.content.into_iter().for_each(|i: (u32, (Vec<i64>, Vec<String>))| {
			self.content.insert(i.0, i.1);
		});
	}
	pub fn content (&self) -> &BTreeMap<u32, (Vec<i64>, Vec<String>)> {
		&self.content
	}
}