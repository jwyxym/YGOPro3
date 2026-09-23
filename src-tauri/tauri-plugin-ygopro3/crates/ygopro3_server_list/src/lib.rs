use basic_toml::{from_str, to_string};
use indexmap::{IndexMap, map::Entry};
use serde::{Serialize, Deserialize};
use anyhow::{Error, Result, anyhow};
use ini::Ini;

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
	pub fn init_by_toml (&mut self, text: String) -> () {
		if let Ok(servers) = from_str::<IndexMap<String, String>>(&text) {
			let servers: Server = Self {
				servers: servers
			};
			servers.content().into_iter().for_each(|(k, v)| {
				self.servers.insert(String::from(k), String::from(v));
			});
		}
	}
	pub fn merge (&mut self, text: &str) -> bool {
		if let Ok(servers) = from_str::<IndexMap<String, String>>(text) {
			let mut result: bool = false;
			for (key, value) in servers {
				match self.servers.entry(key) {
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
	pub fn init_by_conf (&mut self, text: String) -> () {
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
	pub fn init_by_ini (&mut self, text: String) -> () {
		if let Ok((name, host, port)) = (|| -> Result<(String, String, u16), Error> {
			let config: Ini = Ini::load_from_str(&text)?;
			let server: &ini::Properties = config
				.section(Some("YGOMobileAddServer"))
				.ok_or(anyhow!("cannot find server config"))?;
			let name: &str = server
				.get("ServerName").ok_or(anyhow!("cannot find server name"))?;
			let host: &str = server
				.get("ServerHost").ok_or(anyhow!("cannot find server host"))?;
			let port: u16 = server
				.get("ServerPort")
				.and_then(|v| v.parse().ok())
				.unwrap_or(0);
			Ok((String::from(name), String::from(host), port))
		})() {
			self.servers
				.insert(if port == 0 {
					host
				} else {
					format!("{}:{}", host, port)
				}, name);
		}
	}
	pub fn content (&self) -> &IndexMap<String, String> {
		&self.servers
	}
	pub fn to_string (&self) -> Result<String, Error> {
		Ok(to_string(&self.servers)?)
	}
}