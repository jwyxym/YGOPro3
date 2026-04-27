use super::File;
use std::{collections::BTreeMap, path::Path};
use walkdir::WalkDir;
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct Font {
	content: BTreeMap<String, String>
}
impl Font {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: String, value: String) -> () {
		self.content.insert(key, value);
	}

	pub fn read_dir<P: AsRef<Path>> (mut self, path: P, fonts: Vec<(String, String)>) -> Self {
		WalkDir::new(path)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if file.ext() == "ttf"
						&& let Some(i) = fonts.iter().find(|i| i.1 == String::from(file.name())) {
						let key: String = i.0.clone();
						let content: String = file.url();
						return Some((key, content));
					}
				}
				None
			})
			.for_each(|i: (String, String)| {
				self.insert(i.0, i.1);
			});
		self
	}

	pub fn to_array (&self) -> Vec<(String, String)> {
		self.content.clone().into_iter().collect()
	}
}