use ygopro3_fs::File;

use std::{collections::BTreeMap, path::Path};
use serde::Serialize;
use walkdir::WalkDir;

#[derive(Serialize, Clone, Debug)]
pub enum ScriptContent {
	Path(String),
	ZipFile(usize)
}
#[derive(Serialize, Clone, Debug)]
pub struct Script {
	content: BTreeMap<String, ScriptContent>,
}
impl Script {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: String, value: ScriptContent) -> () {
		self.content.insert(key, value);
	}

	pub fn get (&self, key: &str) -> Option<&ScriptContent> {
		self.content.get(key)
	}

	pub fn read_dir<P: AsRef<Path>> (mut self, path: P) -> Self {
		WalkDir::new(path)
			.max_depth(1)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if file.ext() == "lua" {
						return Some((String::from(file.name()), String::from(file.path())));
					}
				}
				None
			})
			.for_each(|i| {
				self.content.insert(i.0, ScriptContent::Path(i.1));
			});
		self
	}
	pub fn to_array (&self) -> Vec<(String, ScriptContent)> {
		self.content.clone().into_iter().collect()
	}
}