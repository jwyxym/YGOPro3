mod async_db;
mod sync_db;

use std::{collections::BTreeMap, path::Path};
use serde::Serialize;
use anyhow::{Result, Error};

const STMT: &str = "SELECT
	datas.id,
	datas.ot,
	datas.alias,
	datas.setcode,
	datas.type,
	datas.atk,
	datas.def,
	datas.level,
	datas.race,
	datas.attribute,
	datas.category,
	texts.id,
	texts.name,
	texts.desc,
	texts.str1,
	texts.str2,
	texts.str3,
	texts.str4,
	texts.str5,
	texts.str6,
	texts.str7,
	texts.str8,
	texts.str9,
	texts.str10,
	texts.str11,
	texts.str12,
	texts.str13,
	texts.str14,
	texts.str15,
	texts.str16
	FROM datas, texts WHERE datas.id = texts.id";

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
	pub async fn init<P: AsRef<Path>> (&mut self, path: P) -> Result<(), Error> {
		async_db::init(path).await?.into_iter().for_each(move |i: (u32, (Vec<i64>, Vec<String>))| {
			self.content.insert(i.0, i.1);
		});
		Ok(())
	}
	pub fn init_by_buffer (&mut self, data: Vec<u8>) -> Result<(), Error> {
		sync_db::init(data)?.into_iter().for_each(|i: (u32, (Vec<i64>, Vec<String>))| {
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