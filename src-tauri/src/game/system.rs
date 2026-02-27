use serde::{Serialize, Deserialize};
use basic_toml::{from_str, to_string};
use std::collections::BTreeMap;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct System {
	string: BTreeMap<String, String>,
	boolean: BTreeMap<String, bool>,
	number: BTreeMap<String, f64>,
	array: BTreeMap<String, Vec<String>>
}

impl System {
	pub fn new (text: String) -> Self {
		let mut system: Self = from_str::<Self>(&text).unwrap_or(Self::default());
		system.array
			.entry(String::from("LOADING_EXPANSION"))
			.or_insert(Vec::new());
		["HIDDEN_NAME", "HIDDEN_CHAT"]
			.into_iter().for_each(|i| {
				system.boolean
					.entry(String::from(i))
					.or_insert(false);
			});
		["DELETE_YPK", "DELETE_DECK", "EXIT_DECK", "SWAP_BUTTON", "SORT_DECK", "DISRUPT_DECK", "CLEAR_DECK", "SELECT_SORT"]
			.into_iter().for_each(|i| {
				system.boolean
					.entry(String::from(i))
					.or_insert(true);
			});
		system.number
			.entry(String::from("BACK_BGM"))
			.or_insert(20.0);
		system.number
			.entry(String::from("CT_CARD"))
			.or_insert(3.0);
		system.number
			.entry(String::from("CT_DECK_MAIN"))
			.or_insert(60.0);
		system.number
			.entry(String::from("CT_DECK_EX"))
			.or_insert(15.0);
		system.number
			.entry(String::from("CT_DECK_SIDE"))
			.or_insert(15.0);
		system.number
			.entry(String::from("CT_AVATAR_SELF"))
			.or_insert(0.0);
		system.number
			.entry(String::from("CT_AVATAR_OPPO"))
			.or_insert(0.0);
		["SERVER_PLAYER_NAME", "SERVER_ADDRESS", "SERVER_PASS"]
			.into_iter().for_each(|i| {
				system.string
					.entry(String::from(i))
					.or_insert(String::from(""));
			});
		
		let i18n: &mut String = system.string
			.entry(String::from("I18N"))
			.or_insert(String::from("zh-CN"));
		if !["zh-CN", "ko-KR"].contains(&i18n.as_str()) {
			*i18n = String::from("zh-CN");
		}
		system

	}
	pub fn default () -> Self {
		Self {
			string: BTreeMap::new(),
			boolean: BTreeMap::new(),
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
	pub fn to_array (&self) -> (Vec<(String, String)>, Vec<(String, bool)>, Vec<(String, f64)>, Vec<(String, Vec<String>)>) {
		(
			self.string.clone().into_iter().collect(),
			self.boolean.clone().into_iter().collect(),
			self.number.clone().into_iter().collect(),
			self.array.clone().into_iter().collect()
		)
	}
	pub fn array (&self) -> &BTreeMap<String, Vec<String>> {
		&self.array
	}
	pub fn string (&self) -> &BTreeMap<String, String> {
		&self.string
	}
	pub fn i18n (&self) -> String {
		String::from(
			self
			.string()
			.get("I18N")
			.unwrap_or(&String::from("zh-CN"))
		)
	}

}