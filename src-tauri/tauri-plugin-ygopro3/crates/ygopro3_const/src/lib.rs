use std::{path::PathBuf, time::Duration, sync::OnceLock};
use lazy_static::lazy_static;
use regex::Regex;
use bincode::config::{standard, Configuration};

lazy_static! {
	pub static ref PIC_REGEX: Regex = Regex::new(r"^pics/(\d+)\.(jpg|png|jpeg)$").unwrap();
}

pub static RESOURCE_PATH: OnceLock<PathBuf> = OnceLock::new();
pub static PATH: OnceLock<PathBuf> = OnceLock::new();

pub const URL_GAME_VERSION: &str = "https://s3.ygopro3.cn/ygopro3/version.txt";

pub static CONFIG : Configuration = standard();

pub const P2P_ALPN: &[u8] = b"ygopro3/p2p";
pub const P2P_PREFIX: &str = "ygopro3-p2p://";
pub const P2P_MAX_CODE_LENGTH: usize = 8192;
pub const P2P_MAX_CONNECTIONS: usize = 32;
pub const P2P_CONNECT_TIMEOUT: Duration = Duration::from_secs(30);
pub const P2P_RELAY_TIMEOUT: Duration = Duration::from_secs(5);
pub const P2P_JOIN_TIMEOUT: Duration = Duration::from_secs(8);
pub const P2P_HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(10);
pub const P2P_LOCAL_CONNECT_TIMEOUT: Duration = Duration::from_secs(60);
pub const P2P_SHUTDOWN_TIMEOUT: Duration = Duration::from_secs(5);