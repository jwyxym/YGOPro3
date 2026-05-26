use serde::{Serialize, Deserialize};
use basic_toml::{from_str, to_string};
use std::collections::{BTreeMap, btree_map::Entry};
use anyhow::{Error, Result};

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
	pub fn merge (&mut self, text: &str) -> bool {
		if let Ok(info) = from_str::<Self>(text) {
			let mut result: bool = false;
			fn merge (target: &mut BTreeMap<String, String>, source: BTreeMap<String, String>) -> bool {
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

			result = result || merge(&mut self.ot, info.ot);
			result = result || merge(&mut self.attribute, info.attribute);
			result = result || merge(&mut self.category, info.category);
			result = result || merge(&mut self.race, info.race);
			result = result || merge(&mut self.types, info.types);
			result = result || merge(&mut self.link, info.link);
			return result;
		}
		false
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
	pub fn to_string (&self) -> Result<String, Error> {
		Ok(to_string(&self)?)
	}
}