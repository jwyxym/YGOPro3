use serde::Serialize;
use std::collections::BTreeMap;
use regex::Regex;

#[derive(Serialize, Clone, Debug)]
pub struct Server {
	content: BTreeMap<String, String>
}

impl Server {
	pub fn new (text: String) -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn to_array (&self) -> Vec<(String, String)> {
		self.content.clone().into_iter().collect()
	}
}