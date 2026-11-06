use ygopro3_fs::File;

use serde::{Deserialize, Serialize};
use basic_toml::{from_str, to_string};
use std::{path::{Path, PathBuf}, collections::HashSet};
use indexmap::{IndexMap, map::Entry};
use anyhow::{Error, Result};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Resource {
	ot: IndexMap<String, String>,
	attribute: IndexMap<String, String>,
	category: IndexMap<String, String>,
	race: IndexMap<String, String>,
	types: IndexMap<String, String>,
	info: IndexMap<String, String>,
	counter: IndexMap<String, String>,
	other: IndexMap<String, String>,
	sound: IndexMap<String, String>,
	avatar: IndexMap<String, Vec<String>>,
	link: IndexMap<String, (String, String)>,
	btn: IndexMap<String, (String, String)>,
	recognizer: IndexMap<String, String>
}

pub type Textures = (
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, (String, String))>,
	Vec<(String, String)>,
	Vec<(String, String)>,
	Vec<(String, (String, String))>,
	Vec<String>
);

impl Resource {
	pub fn new (text: String) -> Self {
		from_str::<Self>(&text).unwrap_or(Self::default())
	}
	pub fn default () -> Self {
		Self {
			ot: IndexMap::new(),
			attribute: IndexMap::new(),
			link: IndexMap::new(),
			category: IndexMap::new(),
			race: IndexMap::new(),
			types: IndexMap::new(),
			sound: IndexMap::new(),
			btn: IndexMap::new(),
			info: IndexMap::new(),
			counter: IndexMap::new(),
			avatar: IndexMap::new(),
			other: IndexMap::new(),
			recognizer: IndexMap::new(),
		}
	}
	pub fn merge (&mut self, text: &str) -> bool {
		let resource: Self = Self::new(String::from(text));
		let mut result: bool = false;
		fn merge (target: &mut IndexMap<String, String>, source: IndexMap<String, String>) -> bool {
			let mut result: bool = false;
			for (key, value) in source {
				match target.entry(key) {
					Entry::Occupied(_) => (),
					Entry::Vacant(entry) => {
						entry.insert(value);
						result = true;
					}
				};
			}
			result
		}
		fn merge_string_vec (target: &mut IndexMap<String, Vec<String>>, source: IndexMap<String, Vec<String>>) -> bool {
			let mut result: bool = false;
			for (key, value) in source {
				match target.entry(key) {
					Entry::Occupied(mut entry) => {
						let vec: &Vec<String> = entry.get();
						let a: HashSet<String> = vec
							.into_iter()
							.map(|i: &String| i.clone())
							.collect();
						let b: HashSet<String> = value
							.into_iter()
							.collect();

						let value: Vec<String> = a
							.union(&b)
							.map(|i: &String| i.clone())
							.collect();
						if value.len() != vec.len() {
							*entry.get_mut() = value;
							result = true;
						}
					},
					Entry::Vacant(entry) => {
						entry.insert(value);
						result = true;
					}
				};
			}
			result
		}
		fn merge_string_tuple (target: &mut IndexMap<String, (String, String)>, source: IndexMap<String, (String, String)>) -> bool {
			let mut result: bool = false;
			for (key, value) in source {
				match target.entry(key) {
					Entry::Occupied(_) => (),
					Entry::Vacant(entry) => {
						entry.insert(value);
						result = true;
					}
				};
			}
			result
		}

		result |= merge(&mut self.ot, resource.ot);
		result |= merge(&mut self.attribute, resource.attribute);
		result |= merge(&mut self.category, resource.category);
		result |= merge(&mut self.race, resource.race);
		result |= merge(&mut self.types, resource.types);
		result |= merge(&mut self.info, resource.info);
		result |= merge(&mut self.counter, resource.counter);
		result |= merge(&mut self.other, resource.other);
		result |= merge(&mut self.sound, resource.sound);
		result |= merge(&mut self.recognizer, resource.recognizer);
		result |= merge_string_vec(&mut self.avatar, resource.avatar);
		result |= merge_string_tuple(&mut self.btn, resource.btn);
		result |= merge_string_tuple(&mut self.link, resource.link);
		result
	}
	pub fn to_array (&self, path: &Path) -> Textures {
		(
			Self::code_array(&self.ot, path),
			Self::code_array(&self.attribute, path),
			Self::code_array(&self.category, path),
			Self::code_array(&self.race, path),
			Self::code_array(&self.types, path),
			Self::code_array(&self.counter, path),
			self.link.iter()
				.filter_map(|(key, value): (&String, &(String, String))| -> Option<(u32, (String, String))> {
					Some((Self::parse_code(key)?, Self::pair_url(path, value)?))
				})
				.collect(),
			Self::string_array(&self.info, path),
			Self::string_array(&self.other, path),
			self.btn.iter()
				.filter_map(|(key, value): (&String, &(String, String))| -> Option<(String, (String, String))> {
					let urls: (String, String) = Self::pair_url(path, value)?;
					Some((key.clone(), urls))
				})
				.collect(),
			self.avatar.get("AVATAR").into_iter()
				.flatten()
				.filter_map(|value: &String| -> Option<String> {
					Self::file_url(path, value)
				})
				.collect()
		)
	}
	pub fn sound (&self) -> Vec<(&String, &String)> {
		self.sound.iter().collect()
	}
	pub fn recognizer (&self) -> &IndexMap<String, String> {
		&self.recognizer
	}
	pub fn to_string (&self) -> Result<String, Error> {
		Ok(to_string(&self)?)
	}
	pub fn set (&mut self, key: String, value: String) -> bool {
		match self.other.entry(key) {
			Entry::Occupied(mut entry) => {
				if entry.get() == &value {
					false
				} else {
					*entry.get_mut() = value;
					true
				}
			},
			Entry::Vacant(entry) => {
				entry.insert(value);
				true
			}
		}
	}
	fn code_array (map: &IndexMap<String, String>, path: &Path) -> Vec<(u32, String)> {
		map.iter()
			.filter_map(|(key, value): (&String, &String)| -> Option<(u32, String)> {
				Some((Self::parse_code(key)?, Self::file_url(path, value)?))
			})
			.collect()
	}
	fn string_array (map: &IndexMap<String, String>, path: &Path) -> Vec<(String, String)> {
		map.iter()
			.filter_map(|(key, value): (&String, &String)| -> Option<(String, String)> {
				let url: String = Self::file_url(path, value)?;
				Some((key.clone(), url))
			})
			.collect()
	}
	fn pair_url (path: &Path, value: &(String, String)) -> Option<(String, String)> {
		Some((Self::file_url(path, &value.0)?, Self::file_url(path, &value.1)?))
	}
	fn file_url (path: &Path, value: &str) -> Option<String> {
		let path: PathBuf = path.join(value);
		let file: File = File::new(&path)?;
		Some(file.url())
	}
	fn parse_code (key: &str) -> Option<u32> {
		u32::from_str_radix(key.trim_start_matches("0x"),
			if key.starts_with("0x") { 16 } else { 10 }
		).ok()
	}
}