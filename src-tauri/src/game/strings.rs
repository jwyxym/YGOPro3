use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize, Clone, Debug)]
pub struct Strings {
	system: BTreeMap<u32, String>,
	victory: BTreeMap<u32, String>,
	counter: BTreeMap<u32, String>,
	setname: BTreeMap<u32, String>
}

impl Strings {
	pub fn new () -> Self {
		let system: BTreeMap<u32, String> = BTreeMap::new();
		let victory: BTreeMap<u32, String> = BTreeMap::new();
		let counter: BTreeMap<u32, String> = BTreeMap::new();
		let setname: BTreeMap<u32, String> = BTreeMap::new();

		Self {
			system: system,
			victory: victory,
			counter: counter,
			setname: setname
		}
	}
	pub fn init (&mut self, text: String) -> () {
		let parts: Vec<Vec<String>> = text.lines()
			.map(|i|
				String::from(i)
					.split_whitespace()
					.map(String::from)
					.collect()
			)
			.collect();
		parts
			.into_iter()
			.for_each(|i| {
				if i.len() > 2
					&& let Ok(key) = u32::from_str_radix(
						&i[1].trim_start_matches("0x"),
						if i[1].starts_with("0x") { 16 } else { 10 }
				) {
					let value: String = i[2].clone();
					match i[0].as_str() {
						"!system" => self.system.insert(key, value),
						"!victory" => self.victory.insert(key, value),
						"!counter" => self.counter.insert(key, value),
						"!setname" => self.setname.insert(key, value),
						_ => None
					};
				}
			});
	}
}