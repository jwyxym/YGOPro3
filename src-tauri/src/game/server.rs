use crate::game::regex::LINE_REGEX;
use std::collections::BTreeMap;
use serde::{Serialize, Deserialize};
use basic_toml::from_str;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Server {
	servers: BTreeMap<String, String>
}

impl Server {
	pub fn new () -> Self {
		Self {
			servers: BTreeMap::new()
		}
	}

	pub fn init_toml(&mut self, text: String) -> () {
		if let Ok(servers) = from_str::<Self>(&text) {
			servers.to_array().into_iter().for_each(|(k, v)| {
				self.servers.insert(k, v);
			});
		}
		
	}

	pub fn init_conf(&mut self, text: String) -> () {
		
	}

	pub fn init_ini(&mut self, text: String) -> () {
		
	}

	pub fn to_array (&self) -> Vec<(String, String)> {
		self.servers.clone().into_iter().collect()
	}
}