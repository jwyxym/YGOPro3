use super::File;
use std::{collections::BTreeMap, path::Path};
use walkdir::WalkDir;
use serde::Serialize;
#[derive(Serialize, Clone, Debug)]
pub struct Sound {
	content: BTreeMap<String, String>
}
impl Sound {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: String, value: String) -> () {
		self.content.insert(key, value);
	}

	pub fn read_dir<P: AsRef<Path>> (mut self, path: P, sounds: Vec<(String, String)>) -> Self {
		WalkDir::new(path)
			.max_depth(1)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if file.ext() == "mp3"
						&& let Some(i) = sounds
							.iter()
							.find(|i| i.1 == String::from(file.name())) {
						return Some((i.0.clone(), file.url()));
					}
				}
				None
			})
			.for_each(|(key, value)| {
				self.insert(key, value);
			});
		self
	}

	pub fn to_array (&self) -> Vec<(String, String)> {
		self.content.clone().into_iter().collect()
	}
}