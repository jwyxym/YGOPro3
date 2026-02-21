use serde::Serialize;
use std::collections::BTreeMap;
use regex::Regex;

#[derive(Serialize, Clone, Debug)]
pub struct Strings {
	name: String,
	system: BTreeMap<i64, String>,
	victory: BTreeMap<i64, String>,
	counter: BTreeMap<i64, String>,
	setname: BTreeMap<i64, String>
}

impl Strings {
	pub fn new (name: String) -> Self {
		let system: BTreeMap<i64, String> = BTreeMap::new();
		let victory: BTreeMap<i64, String> = BTreeMap::new();
		let counter: BTreeMap<i64, String> = BTreeMap::new();
		let setname: BTreeMap<i64, String> = BTreeMap::new();

		Self {
			name: name,
			system: system,
			victory: victory,
			counter: counter,
			setname: setname
		}
	}
	pub fn init (mut self, text: String) -> Self {
		let re: Regex = Regex::new(r"\r?\n").unwrap();
		let parts: Vec<Vec<String>> = re.split(&text)
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
					&& let Ok(key) = i64::from_str_radix(
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
		self
	}
}