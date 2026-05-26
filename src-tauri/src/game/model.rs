use basic_toml::{from_str, to_string};
use indexmap::{IndexMap, map::Entry};
use serde::{Serialize, Deserialize};
use anyhow::{Error, Result};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Model {
	model: IndexMap<String, String>
}

impl Model {
	pub fn new () -> Self {
		Self {
			model: IndexMap::new()
		}
	}
	pub fn init(&mut self, text: String) -> () {
		if let Ok(i) = from_str::<Self>(&text) {
			self.model = i.model;
		}
	}
	pub fn merge (&mut self, text: &str) -> bool {
		if let Ok(model) = from_str::<Self>(text) {
			let mut result: bool = false;
			for (key, value) in model.model {
				match self.model.entry(key) {
					Entry::Occupied(_) => (),
					Entry::Vacant(entry) => {
						entry.insert(value);
						result = true;
					}
				};
			}
			return result;
		}
		false
	}
	pub fn to_array (&self) -> Vec<(String, String)> {
		self.model.clone().into_iter().collect()
	}
	pub fn to_string (&self) -> Result<String, Error> {
		Ok(to_string(&self)?)
	}
}