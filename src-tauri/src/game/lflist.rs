use serde::Serialize;
use std::collections::BTreeMap;
use regex::Regex;

#[derive(Serialize, Clone, Debug)]
pub struct LFList {
	content: BTreeMap<String, BTreeMap<i64, String>>
}

impl LFList {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub fn init (&mut self, text: String) -> () {
		let re: Regex = Regex::new(r"\r?\n").unwrap();
	}
}