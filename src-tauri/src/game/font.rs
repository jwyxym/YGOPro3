use crate::game::file::File;
use std::{collections::BTreeMap, path::Path};
use walkdir::WalkDir;
use anyhow::{Result, Error};
use tokio::{
	task::{JoinHandle, spawn},
	fs::read
};
pub struct Font {
	content: BTreeMap<String, Vec<u8>>
}
impl Font {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: String, value: Vec<u8>) -> () {
		self.content.insert(key, value);
	}

	pub async fn read_dir<P: AsRef<Path>> (&mut self, path: P) -> Result<(), Error> {
		let tasks: Vec<JoinHandle<Result<(String, Vec<u8>), Error>>> = WalkDir::new(path)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if file.ext() == "ttf" {
						return Some(spawn(async move {
							let content: Vec<u8> = read(file.path()).await?;
							Ok((String::from(file.name()), content))
						}));
					}
				}
				None
			})
			.collect();
		for task in tasks {
			let (key, value) = task.await??;
			self.insert(key, value);
		}
		Ok(())
	}

	pub fn to_array (&self) -> Vec<(String, Vec<u8>)> {
		self.content.clone().into_iter().collect()
	}
}