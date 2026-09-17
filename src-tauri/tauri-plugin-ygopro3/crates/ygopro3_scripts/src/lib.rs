use std::collections::BTreeMap;

#[derive(Clone, Debug)]
pub struct Script {
	content: BTreeMap<String, usize>,
}
impl Script {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}

	pub fn insert (&mut self, key: String, value: usize) -> () {
		self.content.insert(key, value);
	}

	pub fn get (&self, key: &str) -> Option<&usize> {
		self.content.get(key)
	}

	pub fn to_array (&self) -> Vec<(String, usize)> {
		self.content.clone().into_iter().collect()
	}
}