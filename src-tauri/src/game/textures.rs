use crate::game::File;
use serde::{Serialize, Deserialize};
use basic_toml::{from_str, to_string};
use std::{collections::BTreeMap, path::{Path, PathBuf}};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Textures {
	ot: BTreeMap<String, String>,
	attribute: BTreeMap<String, String>,
	link: BTreeMap<String, (String, String)>,
	category: BTreeMap<String, String>,
	race: BTreeMap<String, String>,
	types: BTreeMap<String, String>,
}

impl Textures {
	pub fn new (text: String, path: &Path) -> Self {
		let mut textures: Self = from_str::<Self>(&text).unwrap_or(Self::default());
		for (_, value) in textures.ot.iter_mut() {
			let p: PathBuf = path.join(&value).with_added_extension("png");
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, value) in textures.attribute.iter_mut() {
			let p: PathBuf = path.join(&value).with_added_extension("png");
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, value) in textures.race.iter_mut() {
			let p: PathBuf = path.join(&value).with_added_extension("png");
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, value) in textures.types.iter_mut() {
			let p: PathBuf = path.join(&value).with_added_extension("png");
			if let Some(p) = File::new(&p) {
				*value = p.url();
			}
		}
		for (_, (valueI, valueII)) in textures.link.iter_mut() {
			let p: PathBuf = path.join(&valueI).with_added_extension("png");
			if let Some(p) = File::new(&p) {
				*valueI = p.url();
			}
			let p: PathBuf = path.join(&valueII).with_added_extension("png");
			if let Some(p) = File::new(&p) {
				*valueII = p.url();
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
			types: BTreeMap::new()
		}
	}
	pub fn to_string (&self) -> String {
		to_string(&self)
			.unwrap_or(to_string(&Self::default())
				.unwrap_or(String::from(""))
			)
	}
}