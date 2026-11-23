use serde::{Serialize, Deserialize};
use basic_toml::from_str;
use std::{collections::{BTreeMap, HashMap}, path::PathBuf};
use ygopro3_fs::File;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Spine {
	content: HashMap<u32, SpineItem>
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct SpineItem {
	skeleton: String,
	atlas: String,
	img : BTreeMap<String, String>
}

#[derive(Deserialize, Default)]
struct SpineConfig {
	spine: Vec<SpineConfigItem>
}

#[derive(Deserialize)]
struct SpineConfigItem {
	id: u32,
	#[serde(flatten)]
	item: SpineItem
}

impl Spine {
	pub fn new (text: String) -> Self {
		let config: SpineConfig = from_str::<SpineConfig>(&text).unwrap_or_default();
		let content: HashMap<u32, SpineItem> = config.spine.into_iter()
			.map(|entry: SpineConfigItem| (entry.id, entry.item))
			.collect();
		Self { content }
	}
	pub fn default () -> Self {
		Self { content: HashMap::new() }
	}
	pub fn get (&self, id: u32, path: PathBuf) -> Option<SpineItem> {
		let i: &SpineItem = self.content.get(&id)?;

		let skeleton: File = File::new(&path.join(&i.skeleton))?;
		let atlas: File = File::new(&path.join(&i.atlas))?;
		let mut img: BTreeMap<String, String> = BTreeMap::new();

		for (name, p) in &i.img {
			let file: File = File::new(&path.join(p))?;
			img.insert(name.clone(), file.url());
		}

		Some(SpineItem {
			skeleton: skeleton.url(),
			atlas: atlas.url(),
			img
		})
	}
}