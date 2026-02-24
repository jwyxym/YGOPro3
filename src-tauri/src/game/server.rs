use basic_toml::from_str;
use indexmap::IndexMap;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Server {
	servers: IndexMap<String, String>
}

impl Server {
	pub fn new () -> Self {
		Self {
			servers: IndexMap::new()
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
		let mut host: String = String::new();
		let mut port: String = String::new();
		let mut name: String = String::new();
		text
			.lines()
			.filter_map(|i| {
				let parts: Vec<&str> = i.split("=").collect();
				if parts.len() > 1 { Some(parts) } else { None }
			})
			.map(|i| [i[0].trim(), i[1].trim()])
			.for_each(|i: [&str; 2]| {
				if i[0] == "ServerName" {
					name = String::from(i[1]);
				} else if i[0] == "ServerHost" {
					host = String::from(i[1]);
				} else if i[0] == "ServerPort" {
					port = String::from(i[1]);
				}
			});
		if !name.is_empty() && !host.is_empty() {
			self.servers.insert(if port.is_empty() { host } else { format!("{}:{}", host, port) }, name);
		}
	}
	pub fn to_array (&self) -> Vec<(String, String)> {
		self.servers.clone().into_iter().collect()
	}
}