use serde::{Serialize, Deserialize};
use basic_toml::from_str;
use std::{collections::BTreeMap};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct CardInfo {
	ot: BTreeMap<u32, String>,
	attribute: BTreeMap<u32, String>,
	link: BTreeMap<u32, String>,
	category: BTreeMap<u32, String>,
	race: BTreeMap<u32, String>,
	types: BTreeMap<u32, String>
}

impl CardInfo {
	pub fn new (text: String) -> Self {
		from_str::<Self>(&text).unwrap_or(Self::default())
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
	pub fn to_array (&self) -> (
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>
	) {
		(
			self.ot.clone().into_iter().collect(),
			self.attribute.clone().into_iter().collect(),
			self.link.clone().into_iter().collect(),
			self.category.clone().into_iter().collect(),
			self.race.clone().into_iter().collect(),
			self.types.clone().into_iter().collect()
		)
	}
}