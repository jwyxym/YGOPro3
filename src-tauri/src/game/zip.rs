use crate::game::{PIC_REGEX, cdb::Cdb};
use serde::Serialize;
use anyhow::{Result, Error};
use zip::{ZipArchive, read::ZipFile};
use tokio::task::{JoinHandle, spawn_blocking};
use std::{
	fs::{File, write, exists, create_dir_all},
	io::Read,
	collections::BTreeMap,
	path::{Path, PathBuf}
};
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone, Debug)]
pub struct Zip {
	name: String,
	pics: BTreeMap<u32, Vec<u8>>,
	db: Vec<Cdb>,
	ini: Vec<String>,
	lflist: Vec<String>,
	strings: Vec<String>,
	servers: Vec<String>
}

impl Zip {
	pub fn new (path: String, name: String) -> JoinHandle<Result<Self, Error>> {
		spawn_blocking(move || {
			let mut pics: BTreeMap<u32, Vec<u8>> = BTreeMap::new();
			let mut db: Vec<Cdb>= Vec::new();
			let mut ini: Vec<String>= Vec::new();
			let mut lflist: Vec<String>= Vec::new();
			let mut strings: Vec<String>= Vec::new();
			let mut servers: Vec<String>= Vec::new();
			let _ = Self::read(&path, |name, mut file| {
				if let Some(_match) = PIC_REGEX
					.captures(&name)
					.and_then(|i| Some(i)?
					.get(1))
				{
					let mut content: Vec<u8> = Vec::new();
					if let Ok(code) = _match.as_str().parse::<u32>()
						&& file.read_to_end(&mut content).is_ok() {
						pics.insert(code, content);
					}
				} else if name.ends_with("ini") {
					let mut content: String = String::new();
					if file.read_to_string(&mut content).is_ok() {
						ini.push(content);
					}
				} else if name.ends_with("strings.conf") {
					let mut content: String = String::new();
					if file.read_to_string(&mut content).is_ok() {
						strings.push(content);
					}
				} else if name.ends_with("lflist.conf") {
					let mut content: String = String::new();
					if file.read_to_string(&mut content).is_ok() {
						lflist.push(content);
					}
				} else if name.ends_with("servers.conf") {
					let mut content: String = String::new();
					if file.read_to_string(&mut content).is_ok() {
						servers.push(content);
					}
				} else if name.ends_with("cdb") {
					let mut content: Vec<u8> = Vec::new();
					if file.read_to_end(&mut content).is_ok() {
						let mut cdb: Cdb = Cdb::new();
						if cdb.init_by_buffer(content).is_ok() {
							db.push(cdb);
						}
					}
				}
			
				Ok(())
			});
			Ok::<Self, Error>(Self {
				name: name,
				pics: pics,
				db: db,
				ini: ini,
				lflist: lflist,
				strings: strings,
				servers: servers
			})
		})
	}
	pub fn new_with_emit (app: &AppHandle, path: String, name: String) -> Result<Self, Error> {
		let file: File = File::open(&path)?;
		let archive: ZipArchive<File> = ZipArchive::new(file)?;
		let len: usize = archive.len();
		app.emit("started", len)?;
		let mut pics: BTreeMap<u32, Vec<u8>> = BTreeMap::new();
		let mut db: Vec<Cdb>= Vec::new();
		let mut ini: Vec<String>= Vec::new();
		let mut lflist: Vec<String>= Vec::new();
		let mut strings: Vec<String>= Vec::new();
		let mut servers: Vec<String>= Vec::new();
		let ct: usize = Self::read(&path, |name, mut file| {
			app.emit("progress", 1)?;
			if let Some(_match) = PIC_REGEX
				.captures(&name)
				.and_then(|i| Some(i)?
				.get(1))
			{
				let mut content: Vec<u8> = Vec::new();
				if let Ok(code) = _match.as_str().parse::<u32>()
					&& file.read_to_end(&mut content).is_ok() {
					pics.insert(code, content);
				}
			} else if name.ends_with("ini") {
				let mut content: String = String::new();
				if file.read_to_string(&mut content).is_ok() {
					ini.push(content);
				}
			} else if name.ends_with("strings.conf") {
				let mut content: String = String::new();
				if file.read_to_string(&mut content).is_ok() {
					strings.push(content);
				}
			} else if name.ends_with("lflist.conf") {
				let mut content: String = String::new();
				if file.read_to_string(&mut content).is_ok() {
					lflist.push(content);
				}
			} else if name.ends_with("servers.conf") {
				let mut content: String = String::new();
				if file.read_to_string(&mut content).is_ok() {
					servers.push(content);
				}
			} else if name.ends_with("cdb") {
				let mut content: Vec<u8> = Vec::new();
				if file.read_to_end(&mut content).is_ok() {
					let mut cdb: Cdb = Cdb::new();
					if cdb.init_by_buffer(content).is_ok() {
						db.push(cdb);
					}
				}
			}
			Ok(())
		})?;
		app.emit("progress", len - ct)?;
		Ok::<Self, Error>(Self {
			name: name,
			pics: pics,
			db: db,
			ini: ini,
			lflist: lflist,
			strings: strings,
			servers: servers
		})
	}
	pub async fn unzip<P: AsRef<Path>> (app: &AppHandle, path: P, overwrite: bool) -> Result<(Option<String>, Vec<JoinHandle<Result<(), Error>>>), Error> {
		let mut tasks: Vec<JoinHandle<Result<(), Error>>> = Vec::new();
		let path: &Path = path.as_ref();
		let zip_path: PathBuf = path.join("assets");
		let zip: ZipArchive<File> = ZipArchive::new(File::open(&zip_path)?)?;
		app.emit("started", zip.len())?;
		let mut version: Option<String> = None;
		let _ = Self::read(&zip_path, |name, mut file| {
			app.emit("progress", 1)?;
			if name == String::from("version") {
				let mut content: String = String::new();
				if file.read_to_string(&mut content).is_ok() {
					version.get_or_insert_with(|| content);
				}
			} else {
				let path: PathBuf = path.join(&name);
				if !file.is_dir() && (overwrite || !exists(&path)?) {
					let mut content: Vec<u8> = Vec::new();
					if file.read_to_end(&mut content).is_ok() {
						tasks.push(spawn_blocking(move || {
							if let Some(parent) = path.parent() {
								let _ = create_dir_all(parent);
							}
							write(path, content)?;
							Ok(())
						}));
					}
				}
			}
			Ok(())
		});
		app.emit("end", 0)?;
		Ok((version, tasks))
	}
	pub fn read<P: AsRef<Path>> (
		path: P,
		mut callback: impl FnMut(String, ZipFile) -> Result<(), Error>
	) -> Result<usize, Error> {
		let file: File = File::open(path)?;
		let mut archive: ZipArchive<File> = ZipArchive::new(file)?;
		let mut ct: usize = 0;
		for i in 0..archive.len() {
			let file: ZipFile<'_> = archive.by_index(i)?;
			if !file.is_dir() {
				let name: String = String::from(file.name());
				let _ = callback(name, file);
				ct += 1;
			}
		}
		Ok(ct)
	}
	pub fn name (&self) -> String {
		String::from(&self.name)
	}
	pub fn pics (&self) -> Vec<(u32, Vec<u8>)> {
		self.pics.clone().into_iter().collect()
	}
	pub fn db (&self) -> Vec<Cdb> {
		self.db.clone()
	}
	pub fn ini (&self) -> Vec<String> {
		self.ini.clone()
	}
	pub fn lflist (&self) -> Vec<String> {
		self.lflist.clone()
	}
	pub fn strings (&self) -> Vec<String> {
		self.strings.clone()
	}
	pub fn servers (&self) -> Vec<String> {
		self.servers.clone()
	}
}