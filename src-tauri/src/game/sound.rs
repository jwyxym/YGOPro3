use crate::game::{file::File, sound};
use std::{collections::BTreeMap, path::Path};
use walkdir::WalkDir;
use serde::Serialize;
use anyhow::{Result, Error};
use tokio::{
	task::{JoinHandle, spawn},
	fs::read
};
#[derive(Serialize, Clone, Debug)]
pub struct Sound {
	content: BTreeMap<String, Vec<u8>>
}
impl Sound {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: String, value: Vec<u8>) -> () {
		self.content.insert(key, value);
	}

	pub async fn read_dir<P: AsRef<Path>> (&mut self, path: P, sounds: Vec<(String, String)>) -> Result<(), Error> {
		let tasks: Vec<JoinHandle<Result<(String, Vec<u8>), Error>>> = WalkDir::new(path)
			.max_depth(1)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if file.ext() == "mp3"
						&& let Some(i) = sounds.iter().find(|i| i.1 == String::from(file.name())) {
						let key: String = i.0.clone();
						return Some(spawn(async move {
							let content: Vec<u8> = read(file.path()).await?;
							Ok((key, content))
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