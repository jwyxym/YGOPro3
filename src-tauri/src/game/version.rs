use serde::{Serialize, Deserialize};
use basic_toml::from_str;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Version {
	version: i64,
	url: Vec<URL>
}
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct URL {
	url: (String, String, String),
	header: Vec<(String, String)>
}

impl Version {
	pub fn new (text: String) -> Self {
		from_str::<Self>(&text).unwrap_or(Self::default())
	}
	pub fn default () -> Self {
		Version { version: -1, url: Vec::new() }
	}
	pub fn version (&self) -> i64 {
		self.version
	}
	pub fn url (&self) -> &Vec<URL> {
		&self.url
	}
}

impl URL {
	pub fn speed_test_url (&self) -> &str {
		&self.url.0
	}
	pub fn version_url (&self) -> &str {
		&self.url.1
	}
	pub fn request_url (&self) -> &str {
		&self.url.2
	}
	pub fn request_header (&self) -> &Vec<(String, String)> {
		&self.header
	}
}