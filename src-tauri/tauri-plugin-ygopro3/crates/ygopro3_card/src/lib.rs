use std::{collections::BTreeMap, path::Path};
use serde::Serialize;
use anyhow::{Result, Error};
use ygopro_cdb_reader::{buffer, path};
pub use ygopro_cdb_reader::Card;

#[derive(Serialize, Clone, Debug)]
pub struct Cdb {
	content: BTreeMap<u32, Card>
}

impl Cdb {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub async fn init<P: AsRef<Path>> (&mut self, p: P) -> Result<(), Error> {
		path(p).await?.into_iter().for_each(move |i: Card| {
			self.content.insert(i.code, i);
		});
		Ok(())
	}
	pub fn init_by_buffer (&mut self, data: Vec<u8>) -> Result<(), Error> {
		buffer(data)?.into_iter().for_each(move |i: Card| {
			self.content.insert(i.code, i);
		});
		Ok(())
	}
	pub fn init_by_db (&mut self, db: Cdb) -> () {
		db.content.into_iter().for_each(|i| {
			self.content.insert(i.0, i.1);
		});
	}
	pub fn content (&self) -> &BTreeMap<u32, Card> {
		&self.content
	}
	pub fn add_ex_code (mut self, ex_code: &BTreeMap<u32, Vec<u16>>) -> Self {
		for (code, set_codes) in ex_code {
			if let Some(card) = self.content.get_mut(code)
				&& let Some(mut i) = card.setcode.iter().position(|&x| x == 0) {
				for &set_code in set_codes {
					if set_code == 0 {
						continue;
					}
					if i >= card.setcode.len() {
						break;
					}
					card.setcode[i] = set_code;
					i += 1;
				}
			};
		}
		self
	}
}