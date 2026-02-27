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
	pub fn to_array (&self) -> (
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>
	) {
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
				.collect()
		)
	}
}