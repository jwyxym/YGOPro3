use std::path::PathBuf;
use std::sync::OnceLock;
use lazy_static::lazy_static;
use regex::Regex;

lazy_static! {
	pub static ref PIC_REGEX: Regex = Regex::new(r"^pics/(\d+)\.(jpg|png|jpeg)$").unwrap();
}

pub static RESOURCE_PATH: OnceLock<PathBuf> = OnceLock::new();
pub static PATH: OnceLock<PathBuf> = OnceLock::new();

pub const URL_GAME_VERSION: &str = "https://s3.ygopro3.cn/ygopro3/version.txt";