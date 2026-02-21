use crate::game::regex::LINE_REGEX;
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize, Clone, Debug)]
pub struct LFList {
	content: BTreeMap<String, BTreeMap<i64, i64>>
}

impl LFList {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub fn init (&mut self, text: String) -> () {
	}
}