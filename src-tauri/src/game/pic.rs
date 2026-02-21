use crate::game::file::File;
use std::{collections::BTreeMap, path::Path};
use walkdir::WalkDir;

#[derive(Clone, Debug)]
pub enum PicContent {
	Path(String),
	Buffer(Vec<u8>)
}
pub struct Pic {
	content: BTreeMap<i64, PicContent>,
}
impl Pic {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: i64, value: PicContent) -> () {
		self.content.insert(key, value);
	}

	pub fn read_dir<P: AsRef<Path>> (&mut self, path: P) -> () {
		WalkDir::new(path)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					let file: File = File::new(i.path())?;
					if ["jpg", "jpeg", "png"].contains(&file.ext()) {
						let code: i64 = i64::from_str_radix(file.stem(), 16).unwrap_or(0);
						if code > 0 {
							return Some((code, file.url()));
						}
					}
				}
				None
			})
			.for_each(|i| {
				if !self.content.contains_key(&i.0) {
					self.content.insert(i.0, PicContent::Path(i.1));
				}
			});
	}

	pub fn to_array (&self) -> Vec<(i64, PicContent)> {
		self.content.clone().into_iter().collect()
	}
}