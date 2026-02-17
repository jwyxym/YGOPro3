use serde::Serialize;
use regex::Regex;
use anyhow::{Result, Error};
use zip::{ZipArchive, read::ZipFile};
use tokio::task::{JoinHandle, spawn_blocking};
use std::{
	fs::File,
	io::Read,
	collections::BTreeMap
};

#[derive(Serialize, Clone, Debug)]
pub struct Zip {
	path: String,
	pics: BTreeMap<i64, Vec<u8>>,
	db: Vec<Vec<u8>>,
	ini: Vec<String>,
	lflist: Vec<String>,
	strings: Vec<String>
}

impl Zip {
	pub fn new (path: String) -> JoinHandle<Result<Self, Error>> {
		spawn_blocking(move || {
			let mut pics: BTreeMap<i64, Vec<u8>> = BTreeMap::new();
			let mut db: Vec<Vec<u8>>= Vec::new();
			let mut ini: Vec<String>= Vec::new();
			let mut lflist: Vec<String>= Vec::new();
			let mut strings: Vec<String>= Vec::new();

			let regex: Regex = Regex::new(r"^pics/(\d+)\.(jpg|png|jpeg)$")?;
			let _ = Self::read(&path, |name, mut zip| {
				if let Some(_match) = regex
					.captures(&name)
					.and_then(|i| Some(i)?
					.get(1))
				{
					let mut content: Vec<u8> = Vec::new();
					if let Ok(code) = _match.as_str().parse::<i64>()
						&& zip.read_to_end(&mut content).is_ok() {
						pics.insert(code, content);
					}
				}
				else if name.ends_with("ini") {
					let mut content: String = String::new();
					if zip.read_to_string(&mut content).is_ok() {
						ini.push(content);
					}
				} else if name.ends_with("strings.conf") {
					let mut content: String = String::new();
					if zip.read_to_string(&mut content).is_ok() {
						strings.push(content);
					}
				} else if name.ends_with("lflist.conf") {
					let mut content: String = String::new();
					if zip.read_to_string(&mut content).is_ok() {
						lflist.push(content);
					}
				} else if name.ends_with("cdb") {
					let mut content: Vec<u8> = Vec::new();
					if zip.read_to_end(&mut content).is_ok() {
						db.push(content);
					}
				}
			
				Ok(())
			});
			Ok::<Self, Error>(Self {
				path: path,
				pics: pics,
				db: db,
				ini: ini,
				lflist: lflist,
				strings: strings
			})
		})
	}
	pub fn read (
		path: &str,
		mut callback: impl FnMut(String, ZipFile) -> Result<(), Error>
	) -> Result<(), Error> {
		let file: File = File::open(path)?;
		let mut archive: ZipArchive<File> = ZipArchive::new(file)?;
		for i in 0..archive.len() {
			let file: ZipFile<'_> = archive.by_index(i)?;
			if !file.is_dir() {
				let name: String = String::from(file.name());
				let _ = callback(name, file);
			}
		}
		Ok(())
	}
	pub fn path (&self) -> &str {
		&self.path
	}
}