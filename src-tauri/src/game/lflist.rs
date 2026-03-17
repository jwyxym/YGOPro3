use super::COMMENTS_REGEX;
use serde::Serialize;
use std::collections::BTreeMap;
use lazy_static::lazy_static;

lazy_static! {
	pub static ref HASH: u32 = {
		let mut h: u32 = 2166136261;
		for byte in "genesys".bytes() {
			h ^= byte as u32;
			h = h.wrapping_mul(16777619);
		}
		h
	};
}

#[derive(Serialize, Clone, Debug)]
pub struct LFList {
	content: BTreeMap<String, LFListContent>,
}

#[derive(Serialize, Clone, Debug)]
pub struct LFListContent {
	genesys: u32,
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
					let mut lflist: BTreeMap<u32, u32> = BTreeMap::new();
					let mut glist: BTreeMap<u32, u32> = BTreeMap::new();
					let mut genesys: u32 = 0;
					let mut hash: u32 = 0x7dfcee6a;
					if let Some(genesy) = text.lines().find(|i| i.starts_with("$genesys")) {
						genesys = {
							let parts: Vec<String> = genesy.split_whitespace().map(String::from).collect();
							if parts.len() > 1 && let Ok(ct) = parts[1].parse::<u32>() {
								hash ^= ((*HASH << 18) | (*HASH >> 14)) ^ ((ct << 9) | (ct >> 23)) ^ ((0x43524544 << 27) | (0x43524544 >> 5));
								ct
							} else { 0 }
						};
					}
					text.lines()
						.filter(|i: &&str| !i.starts_with("#"))
						.filter_map(|i: &str| {
							let i: Vec<String> = i.split_whitespace().map(String::from).collect();
							if i.len() > 1 { Some(i) } else { None }
						})
						.for_each(|i: Vec<String>| {
							if let Ok(code) = i[0].parse::<u32>() {
								if i.len() > 2
									&& i[1].starts_with("$genesys")
									&& let Ok(ct) = i[2].parse::<u32>() {
									glist.insert(code, ct);
									hash ^= ((code << 18) | (code >> 14)) ^ ((*HASH << 9) | (*HASH >> 23)) ^ ((ct << 27) | (ct >> 5));
								} else if let Ok(ct) = i[1].parse::<u32>() {
									lflist.insert(code, ct);
									hash ^= ((code << 18) | (code >> 14)) ^ ((code << (27 + ct)) | (code >> (5 - ct)));
								}
							}
						});
					self.content.insert(String::from(key), LFListContent {
						lflist: lflist,
						hash: hash,
						glist: glist,
						genesys: genesys
					});
				}
			});
	}
	pub fn content (&self) -> &BTreeMap<String, LFListContent> {
		&self.content
	}
}

impl LFListContent {
	pub fn to_array (&self) -> (u32, u32, Vec<(u32, u32)>, Vec<(u32, u32)>) {
		(
			self.hash,
			self.genesys,
			self.lflist.clone().into_iter().collect(),
			self.glist.clone().into_iter().collect()
		)
	}
}