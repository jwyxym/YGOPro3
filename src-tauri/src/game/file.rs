use super::Cdb;

use std::path::Path;
use serde::Serialize;
use tauri_plugin_os::{OsType, type_};
use urlencoding::encode;


#[derive(Serialize, Clone, Debug)]
pub enum FileContent {
	Model(String),
	LFList(String),
	Servers(String),
	ServersIni(String),
	ServersConf(String),
	System(String),
	Resource(String),
	CardInfo(String),
	Strings(String),
	Cdb(Cdb)
}

#[derive(Serialize, Clone, Debug)]
pub struct File {
	name: String,
	stem: String,
	ext: String,
	path: String
}

impl File {
	pub fn new (path: &Path) -> Option<Self> {
		if !path.is_file() {
			return None;
		}
		let name: &str = path.file_name().and_then(|n| n.to_str())?;
		let stem: &str = path.file_stem().and_then(|n| n.to_str())?;
		let ext: &str = path.extension().and_then(|n| n.to_str())?;
		let path: &str = path.as_os_str().to_str() ?;
		Some(Self {
			name: String::from(name),
			stem: String::from(stem),
			ext: String::from(ext),
			path: String::from(path)
		})
	}
	pub fn url (&self) -> String {
		let path: String = encode(self.path()).into_owned();
		match type_() {
			OsType::Windows | OsType::Android => format!("http://asset.localhost/{}", path),
			_ => format!("asset://localhost/{}", path),
		}
	}
	pub fn name (&self) -> &str {
		&self.name
	}
	pub fn stem (&self) -> &str {
		&self.stem
	}
	pub fn ext (&self) -> &str {
		&self.ext
	}
	pub fn path (&self) -> &str {
		&self.path
	}
}