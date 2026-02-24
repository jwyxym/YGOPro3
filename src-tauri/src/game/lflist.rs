use crate::game::COMMENTS_REGEX;
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize, Clone, Debug)]
pub struct LFList {
	content: BTreeMap<String, LFListContent>,
}

#[derive(Serialize, Clone, Debug)]
pub struct LFListContent {
	genesys: i64,
	hash: u32,
	glist: BTreeMap<u32, u32>,
	lflist: BTreeMap<u32, u32>,
}

impl LFList {
	pub fn new () -> Self {
		Self {
			content: BTreeMap::new()
		}
	}
	pub fn init (&mut self, text: String) -> () {
		COMMENTS_REGEX.replace_all(&text, "").split("!")
			.filter(|i|i.lines().count() > 1)
			.for_each(|text| {
				if let Some(key) = text.lines().nth(0) {
					let mut value: BTreeMap<u32, u32> = BTreeMap::new();
					let mut genesys_value: BTreeMap<u32, u32> = BTreeMap::new();
					let mut genesys: i64 = -1;
					let mut hash: u32 = 0x7dfcee6a;
					if let Some(genesy) = text.lines().find(|i| i.starts_with("$genesys")) {
						genesys = {
							let parts: Vec<String> = genesy.split_whitespace().map(String::from).collect();
							if parts.len() > 1 && let Ok(ct) = parts[1].parse::<i64>() { ct } else { -1 }
						};
					}
					text.lines()
						.filter(|i: &&str| !i.starts_with("#"))
						.for_each(|i: &str| {
							let parts: Vec<String> = i.split_whitespace().map(String::from).collect();
							if parts.len() > 0 && let Ok(code) = parts[0].parse::<u32>() {
								if parts.len() > 2
									&& parts[1].starts_with("$genesys")
									&& let Ok(ct) = parts[2].parse::<u32>() {
									genesys_value.insert(code, ct);
								} else if parts.len() > 1
									&& let Ok(ct) = parts[1].parse::<u32>() {
									value.insert(code, ct);
									hash ^= ((code << 18) | (code >> 14)) ^ ((code << (27 + ct)) | (code >> (5 - ct)));
								}
							}
						});
					self.content.insert(String::from(key), LFListContent {
						lflist: value,
						hash: hash,
						glist: genesys_value,
						genesys: genesys
					});
				}
			});
	}
}