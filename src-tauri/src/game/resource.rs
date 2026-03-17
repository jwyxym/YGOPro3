use super::File;
use serde::{Serialize, Deserialize};
use basic_toml::from_str;
use std::path::{Path, PathBuf};
use indexmap::IndexMap;

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
	font: IndexMap<String, String>,
	avatar: IndexMap<String, Vec<String>>,
	link: IndexMap<String, (String, String)>,
	btn: IndexMap<String, (String, String)>,
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
	pub fn new (text: String, path: &Path) -> Self {
		let mut resource: Self = from_str::<Self>(&text).unwrap_or(Self::default());
		[
			resource.ot.iter_mut(),
			resource.attribute.iter_mut(),
			resource.category.iter_mut(),
			resource.race.iter_mut(),
			resource.types.iter_mut(),
			resource.info.iter_mut(),
			resource.counter.iter_mut(),
			resource.other.iter_mut()
		]
			.into_iter().for_each(|i|
				for (_, value) in i {
					let p: PathBuf = path.join(&value);
					if let Some(p) = File::new(&p) {
						*value = p.url();
					}
				}
			);
		if let Some(avatar) = resource.avatar.get_mut("AVATAR") {
			avatar.iter_mut().for_each(|i| {
				let p: PathBuf = path.join(i.clone());
				if let Some(p) = File::new(&p) {
					*i = p.url();
				}
			});
		}

		[resource.link.iter_mut(), resource.btn.iter_mut()]
			.into_iter().for_each(|i|
				for (_, (value_i, value_ii)) in i {
					let p: PathBuf = path.join(&value_i);
					if let Some(p) = File::new(&p) {
						*value_i = p.url();
					}
					let p: PathBuf = path.join(&value_ii);
					if let Some(p) = File::new(&p) {
						*value_ii = p.url();
					}
				}
			);
		resource
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
			font: IndexMap::new(),
			btn: IndexMap::new(),
			info: IndexMap::new(),
			counter: IndexMap::new(),
			avatar: IndexMap::new(),
			other: IndexMap::new()
		}
	}
	pub fn to_array (&self) -> Textures {
		(
			self.ot.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.attribute.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.category.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.race.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.types.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.counter.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.link.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0.trim_start_matches("0x"),
						if i.0.starts_with("0x") { 16 } else { 10 }
					) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.info.clone().into_iter().collect(),
			self.other.clone().into_iter().collect(),
			self.btn.clone().into_iter().collect(),
			self.avatar.get("AVATAR").unwrap_or(&Vec::new()).to_vec()
		)
	}
	pub fn sound (&self) -> Vec<(String, String)> {
		self.sound.clone().into_iter().collect()
	}
	pub fn font (&self) -> Vec<(String, String)> {
		self.font.clone().into_iter().collect()
	}
}