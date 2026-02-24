mod server_ini;
use server_ini::ServerINI;

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

	pub fn init_by_toml(&mut self, text: String) -> () {
		if let Ok(servers) = from_str::<Self>(&text) {
			servers.to_array().into_iter().for_each(|(k, v)| {
				self.servers.insert(k, v);
			});
		}
		
	}

	pub fn init_by_conf(&mut self, text: String) -> () {
		text
			.lines()
			.filter_map(|i| if i.trim().is_empty() { None } else { Some(i) })
			.for_each(|i| {
				let i: Vec<&str> = i.split("|").collect();
				if i.len() > 1 {
					self.servers.insert(String::from(i[1]), String::from(i[0]));
				}
			});
	}

	pub fn init_by_ini(&mut self, text: String) -> () {
		if let Ok(servers) = from_str::<ServerINI>(&text) {
			self.servers.insert(servers.host(), servers.name());
		}
	}

	pub fn to_array (&self) -> Vec<(String, String)> {
		self.servers.clone().into_iter().collect()
	}
}