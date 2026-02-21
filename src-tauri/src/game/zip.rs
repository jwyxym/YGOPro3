use crate::game::regex::PIC_REGEX;
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use anyhow::{Result, Error};
use zip::{ZipArchive, read::ZipFile};
use tokio::task::{JoinHandle, spawn_blocking};
use std::{
	fs::{File, write, exists, create_dir_all},
	io::Read,
	collections::BTreeMap,
	path::{Path, PathBuf}
};

#[derive(Serialize, Clone, Debug)]
pub struct Zip {
	path: String,
	pics: BTreeMap<i64, Vec<u8>>,
	db: Vec<Vec<u8>>,
	ini: Vec<String>,
	lflist: Vec<String>,
	strings: Vec<String>,
	servers: Vec<String>
}

impl Zip {
	pub fn new (path: String) -> JoinHandle<Result<Self, Error>> {
		spawn_blocking(move || {
			let mut pics: BTreeMap<i64, Vec<u8>> = BTreeMap::new();
			let mut db: Vec<Vec<u8>>= Vec::new();
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
					if let Ok(code) = _match.as_str().parse::<i64>()
						&& file.read_to_end(&mut content).is_ok() {
						pics.insert(code, content);
					}
				}
				else if name.ends_with("ini") {
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
				strings: strings,
				servers: servers
			})
		})
	}
	pub async fn unzip (app: &AppHandle, path: String, overwrite: bool) -> Result<Vec<JoinHandle<Result<(), Error>>>, Error> {
		let mut tasks: Vec<JoinHandle<Result<(), Error>>> = Vec::new();
		let path: &Path = Path::new(&path);
		let zip_path: PathBuf = path.join("assets.zip");
		let file: File = File::open(&zip_path)?;
		let archive: ZipArchive<File> = ZipArchive::new(file)?;
		let len: usize = archive.len();
		app.emit("started",  len * 2)?;
		let _ = Self::read(&zip_path, |name, mut file| {
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
			app.emit("progress", 1)?;
			Ok(())
		});
		(0..len - tasks.len()).for_each(|_| {
			let _ = app.emit("progress", 1);
		});
		Ok(tasks)
	}
	pub fn read<P: AsRef<Path>> (
		path: P,
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
	pub fn pics (&self) -> Vec<(i64, Vec<u8>)> {
		self.pics.clone().into_iter().collect()
	}
	pub fn db (&self) -> Vec<Vec<u8>> {
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