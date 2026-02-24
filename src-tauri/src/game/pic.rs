use crate::game::file::File;
use std::{collections::BTreeMap, path::Path};
use serde::Serialize;
use walkdir::WalkDir;

#[derive(Serialize, Clone, Debug)]
pub enum PicContent {
	Path(String),
	Buffer(Vec<u8>)
}
#[derive(Serialize, Clone, Debug)]
pub struct Pic {
	content: BTreeMap<u32, PicContent>,
}
impl Pic {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: u32, value: PicContent) -> () {
		self.content.insert(key, value);
	}

	pub fn read_dir<P: AsRef<Path>> (mut self, path: P) -> Self {
		WalkDir::new(path)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if ["jpg", "jpeg", "png"].contains(&file.ext()) {
						let code: u32 = file.stem().parse::<u32>().unwrap_or(0);
						if code > 0 {
							return Some((code, file.url()));
						}
					}
				}
				None
			})
			.for_each(|i| {
				self.content.insert(i.0, PicContent::Path(i.1));
			});
		self
	}
	pub fn to_array (&self) -> Vec<(u32, PicContent)> {
		self.content.clone().into_iter().collect()
	}
}