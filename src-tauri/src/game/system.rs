use serde::{Serialize, Deserialize};
use basic_toml::{from_str, to_string};
use std::collections::BTreeMap;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct System {
	string: BTreeMap<String, String>,
	number: BTreeMap<String, f64>,
	array: BTreeMap<String, Vec<String>>
}

impl System {
	pub fn new (text: String) -> Self {
		from_str::<Self>(&text).unwrap_or(Self::default())
	}
	pub fn default () -> Self {
		Self {
			string: BTreeMap::new(),
			number: BTreeMap::new(),
			array: BTreeMap::new()
		}
	}
	pub fn to_string (&self) -> String {
		to_string(&self)
			.unwrap_or(to_string(&Self::default())
				.unwrap_or(String::from(""))
			)
	}

	pub fn to_array (&self) -> (Vec<(String, String)>, Vec<(String, f64)>, Vec<(String, Vec<String>)>) {
		(self.string.clone().into_iter().collect(),
			self.number.clone().into_iter().collect(),
			self.array.clone().into_iter().collect()
		)
	}

	pub fn array (&self) -> &BTreeMap<String, Vec<String>> {
		&self.array
	}

}