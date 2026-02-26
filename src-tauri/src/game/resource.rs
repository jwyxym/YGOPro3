use crate::game::File;
use serde::{Serialize, Deserialize};
use basic_toml::from_str;
use std::{collections::BTreeMap, path::{Path, PathBuf}};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Resource {
	ot: BTreeMap<String, String>,
	attribute: BTreeMap<String, String>,
	category: BTreeMap<String, String>,
	race: BTreeMap<String, String>,
	types: BTreeMap<String, String>,
	info: BTreeMap<String, String>,
	counter: BTreeMap<String, String>,
	other: BTreeMap<String, String>,
	sound: BTreeMap<String, String>,
	font: BTreeMap<String, String>,
	avatar: BTreeMap<String, Vec<String>>,
	link: BTreeMap<String, (String, String)>,
	btn: BTreeMap<String, (String, String)>,
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
			ot: BTreeMap::new(),
			attribute: BTreeMap::new(),
			link: BTreeMap::new(),
			category: BTreeMap::new(),
			race: BTreeMap::new(),
			types: BTreeMap::new(),
			sound: BTreeMap::new(),
			font: BTreeMap::new(),
			btn: BTreeMap::new(),
			info: BTreeMap::new(),
			counter: BTreeMap::new(),
			avatar: BTreeMap::new(),
			other: BTreeMap::new()
		}
	}
	pub fn to_array (&self) -> Textures {
		(
			self.ot.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.attribute.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.category.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.race.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.types.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.counter.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
						Some((code, i.1))
					} else {
						None
					})
				.collect(),
			self.link.clone().into_iter()
				.filter_map(|i|
					if let Ok(code) = u32::from_str_radix(&i.0, 16) {
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