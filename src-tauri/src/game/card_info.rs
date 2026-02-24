use serde::{Serialize, Deserialize};
use basic_toml::from_str;
use std::{collections::BTreeMap};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct CardInfo {
	ot: BTreeMap<String, String>,
	attribute: BTreeMap<String, String>,
	link: BTreeMap<String, String>,
	category: BTreeMap<String, String>,
	race: BTreeMap<String, String>,
	types: BTreeMap<String, String>
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
}