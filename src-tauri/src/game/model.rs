use basic_toml::from_str;
use indexmap::IndexMap;
use serde::{Serialize, Deserialize};

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
	
	pub fn to_array (&self) -> Vec<(String, String)> {
		self.model.clone().into_iter().collect()
	}
}