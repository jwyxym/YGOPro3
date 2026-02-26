use crate::game::File;
use serde::{Serialize, Deserialize};
use basic_toml::from_str;
use std::{collections::BTreeMap, path::{Path, PathBuf}};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Resource {
	ot: BTreeMap<u32, String>,
	attribute: BTreeMap<u32, String>,
	link: BTreeMap<u32, (String, String)>,
	category: BTreeMap<u32, String>,
	race: BTreeMap<u32, String>,
	types: BTreeMap<u32, String>,
	sound: BTreeMap<String, String>,
	font: BTreeMap<String, String>,
}

pub type Textures = (
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, (String, String))>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
);

impl Resource {
	pub fn new (text: String, path: &Path) -> Self {
		let mut textures: Self = from_str::<Self>(&text).unwrap_or(Self::default());
		for (_, value) in textures.ot.iter_mut() {
			let p: PathBuf = path.join(&value);
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, value) in textures.attribute.iter_mut() {
			let p: PathBuf = path.join(&value);
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, value) in textures.race.iter_mut() {
			let p: PathBuf = path.join(&value);
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, value) in textures.types.iter_mut() {
			let p: PathBuf = path.join(&value);
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, (value_i, value_ii)) in textures.link.iter_mut() {
			let p: PathBuf = path.join(&value_i);
			if let Some(p) = File::new(&p) {
				*value_i = p.url();
			}
			let p: PathBuf = path.join(&value_ii);
			if let Some(p) = File::new(&p) {
				*value_ii = p.url();
			}
		}
		textures
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
		}
	}
	pub fn to_array (&self) -> Textures {
		(
			self.ot.clone().into_iter().collect(),
			self.attribute.clone().into_iter().collect(),
			self.link.clone().into_iter().collect(),
			self.category.clone().into_iter().collect(),
			self.race.clone().into_iter().collect(),
			self.types.clone().into_iter().collect(),
		)
	}
	pub fn sound (&self) -> Vec<(String, String)> {
		self.sound.clone().into_iter().collect()
	}
	pub fn font (&self) -> Vec<(String, String)> {
		self.font.clone().into_iter().collect()
	}
}