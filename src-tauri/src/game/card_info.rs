use serde::{Serialize, Deserialize};
use basic_toml::{from_str, to_string};
use std::{collections::BTreeMap};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct CardInfo {
	name: String,
	ot: BTreeMap<String, String>,
	attribute: BTreeMap<String, String>,
	link: BTreeMap<String, String>,
	category: BTreeMap<String, String>,
	race: BTreeMap<String, String>,
	types: BTreeMap<String, String>
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct CardInfoContent {
	ot: BTreeMap<String, String>,
	attribute: BTreeMap<String, String>,
	link: BTreeMap<String, String>,
	category: BTreeMap<String, String>,
	race: BTreeMap<String, String>,
	types: BTreeMap<String, String>
}

impl CardInfo {
	pub fn new (text: String, name: String) -> Self {
		if let Ok(info) = from_str::<CardInfoContent>(&text) {
			return Self {
				name: name,
				ot: info.ot,
				attribute: info.attribute,
				link: info.link,
				category: info.category,
				race: info.race,
				types: info.types
			};
		}
		Self::default()
	}
	pub fn default () -> Self {
		Self {
			name: String::from(""),
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