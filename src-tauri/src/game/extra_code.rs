use serde::{Serialize, Deserialize};
use basic_toml::{from_str, to_string};
use std::collections::{BTreeMap, HashSet, btree_map::Entry};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetCode {
	code: BTreeMap<u32, Vec<u16>>
}

impl SetCode {
	pub fn new (text: String) -> Self {
		from_str::<BTreeMap<String, Vec<u16>>>(&text)
			.map(|i| Self {
				code: i
					.into_iter()
					.filter_map(|(key, value)|
						Self::parse_code(&key).map(|code| (code, value))
					)
					.collect()
			})
			.unwrap_or(Self::default())
	}
	fn parse_code (code: &str) -> Option<u32> {
		let code: &str = code.trim();
		if let Some(code) = code.strip_prefix("0x").or_else(|| code.strip_prefix("0X")) {
			u32::from_str_radix(code, 16).ok()
		} else {
			code.parse::<u32>().ok()
		}
	}
	pub fn default () -> Self {
		Self {
			code: BTreeMap::new()
		}
	}
	pub fn to_string (&self) -> String {
		to_string(&self)
			.unwrap_or(to_string(&Self::default())
				.unwrap_or(String::from(""))
			)
	}
	pub fn merge (&mut self, text: &str) -> bool {
		let setcode: Self = Self::new(String::from(text));
		let mut result: bool = false;
		for (key, value) in setcode.code.into_iter() {
			match self.code.entry(key) {
				Entry::Occupied(mut entry) => {
					let vec: &Vec<u16> = entry.get();
					let a: HashSet<&u16> = vec.iter().collect();
					let b: HashSet<&u16> = value.iter().collect();
					if a != b {
						*entry.get_mut() = value;
						result = true;
					}
				}
				Entry::Vacant(entry) => {
					entry.insert(value);
					result = true;
				}
			};
		}
		result
	}
	pub fn to_array (&self) -> Vec<(u32, Vec<u16>)> {
		self.code.clone().into_iter().collect()
	}
}
