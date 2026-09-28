use serde::Serialize;
use indexmap::IndexMap;

#[derive(Serialize, Clone, Debug)]
pub struct LFList {
	content: IndexMap<String, ygopro_lflist_reader::LFList>,
}

impl LFList {
	pub fn new () -> Self {
		Self {
			content: IndexMap::new()
		}
	}
	pub fn init (&mut self, text: String) -> () {
		let mut lists: IndexMap<String, ygopro_lflist_reader::LFList> = ygopro_lflist_reader::read(&text);
		self.content.append(&mut lists);
	}
	pub fn content (&self) -> &IndexMap<String, ygopro_lflist_reader::LFList> {
		&self.content
	}
}