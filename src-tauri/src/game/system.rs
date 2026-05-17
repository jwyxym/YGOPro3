use anyhow::Error;
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
		[
			"DELETE_YPK",
			"DELETE_DECK",
			"EXIT_DECK",
			"SWAP_BUTTON",
			"SORT_DECK",
			"DISRUPT_DECK",
			"CLEAR_DECK",
			"SELECT_SORT",
			"EXIT_SERVER"
		]
			.into_iter().for_each(|i| {
				system.boolean
					.entry(String::from(i))
					.or_insert(true);
			});
			
		system.number
			.entry(String::from("CT_FRAME"))
			.or_insert(60.0);
		system.number
			.entry(String::from("CT_VOICE"))
			.or_insert(0.2);
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
		#[cfg(not(target_os = "android"))]
		{
			system.number
				.entry(String::from("CT_DECK_PRELINE"))
				.or_insert(10.0);
			system.number
				.entry(String::from("CT_SIDE_PRELINE"))
				.or_insert(15.0);
		}
		#[cfg(target_os = "android")]
		{
			system.number
				.entry(String::from("CT_DECK_PRELINE"))
				.or_insert(6.0);
			system.number
				.entry(String::from("CT_SIDE_PRELINE"))
				.or_insert(9.0);
		}
		[
			"CT_AVATAR_SELF",
			"CT_AVATAR_OPPO",
			"CT_AVATAR_SERVER",
			"CT_AVATAR_WATCHER"
		]
			.into_iter().for_each(|i| {
				system.number
					.entry(String::from(i))
					.or_insert(0.0);
			});
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
	pub fn set (&mut self, key: String, ct: i8, value: String) -> Result<(), Error> {
		Ok(match ct {
			0 => {
				let v: String = serde_json::from_str(&value)?;
				self.string.insert(key, v);
			}
			1 => {
				let v: bool = serde_json::from_str(&value)?;
				self.boolean.insert(key, v);
			}
			2 => {
				let v: f64 = serde_json::from_str(&value)?;
				self.number.insert(key, v);
			}
			3 => {
				let v: Vec<String> = serde_json::from_str(&value)?;
				self.array.insert(key, v);
			}
			_ => ()
		})
	}
}