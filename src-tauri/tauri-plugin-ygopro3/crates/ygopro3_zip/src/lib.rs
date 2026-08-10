use ygopro3_const::PIC_REGEX;

use ygopro3_card::Cdb;
use ygopro3_emit::progress::{self, Event};

use anyhow::{Result, Error};
use tokio::{
	task::{JoinHandle, spawn, spawn_blocking},
	fs::write
};
use std::{
	fs::{File, create_dir_all},
	io::Read,
	collections::BTreeMap,
	path::{Path, PathBuf}
};
use tauri::AppHandle;
use zip::{ZipArchive as Archive, read::ZipFile};

pub type ZipArchive = Archive<File>;

#[derive(Debug)]
pub struct Zip {
	name: String,
	pics: BTreeMap<u32, usize>,
	db: Vec<Cdb>,
	ini: Vec<String>,
	lflist: Vec<String>,
	strings: Vec<String>,
	servers: Vec<String>,
	archive: ZipArchive
}

impl Zip {
	pub fn new (path: String, name: String) -> JoinHandle<Result<Self, Error>> {
		spawn_blocking(move || {
			let mut pics: BTreeMap<u32, usize> = BTreeMap::new();
			let mut db: Vec<Cdb>= Vec::new();
			let mut ini: Vec<String>= Vec::new();
			let mut lflist: Vec<String>= Vec::new();
			let mut strings: Vec<String>= Vec::new();
			let mut servers: Vec<String>= Vec::new();
			let archive: ZipArchive = Self::read(&path, |index: usize, name, mut file| {
				if let Some(_match) = PIC_REGEX
					.captures(&name)
					.and_then(|i| Some(i)?
					.get(1))
				{
					if let Ok(code) = _match.as_str().parse::<u32>() {
						pics.insert(code, index);
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
			Ok::<Self, Error>(Self {
				name: name,
				pics: pics,
				db: db,
				ini: ini,
				lflist: lflist,
				strings: strings,
				servers: servers,
				archive: archive
			})
		})
	}
	pub fn new_with_emit (app: &AppHandle, path: String, name: String) -> Result<Self, Error> {
		let file: File = File::open(&path)?;
		let archive: ZipArchive = Archive::new(file)?;
		let len: usize = archive.len();
		progress::emit(app, Event::Start, len);
		let mut pics: BTreeMap<u32, usize> = BTreeMap::new();
		let mut db: Vec<Cdb>= Vec::new();
		let mut ini: Vec<String>= Vec::new();
		let mut lflist: Vec<String>= Vec::new();
		let mut strings: Vec<String>= Vec::new();
		let mut servers: Vec<String>= Vec::new();
		let archive: ZipArchive = Self::read(&path, |index: usize, name, mut file| {
			progress::emit(app, Event::Progress, 1);
			if let Some(_match) = PIC_REGEX
				.captures(&name)
				.and_then(|i| Some(i)?
				.get(1))
			{
				if let Ok(code) = _match.as_str().parse::<u32>() {
					pics.insert(code, index);
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
		progress::emit(app, Event::Progress, len - archive.len());
		Ok::<Self, Error>(Self {
			name: name,
			pics: pics,
			db: db,
			ini: ini,
			lflist: lflist,
			strings: strings,
			servers: servers,
			archive: archive
		})
	}
	pub async fn unzip<P: AsRef<Path>> (app: &AppHandle, path: P, assets: P) -> Result<Vec<JoinHandle<Result<Option<(String, String)>, Error>>>, Error> {
		let mut tasks: Vec<JoinHandle<Result<Option<(String, String)>, Error>>> = Vec::new();
		let path: &Path = path.as_ref();
		let assets: &Path = assets.as_ref();
		let zip: ZipArchive = Archive::new(File::open(&assets)?)?;
		progress::emit(app, Event::Start, zip.len() * 2 + 6);
		let _ = Self::read(&assets, |_: usize, name: String, mut file: ZipFile<'_>| {
			progress::emit(app, Event::Progress, 1);
			let path: PathBuf = path.join(&name);
			if !file.is_dir() {
				if name.starts_with("config") {
					let mut content: String = String::new();
					if file.read_to_string(&mut content).is_ok() {
						tasks.push(spawn_blocking(|| {
							Ok(Some((name, content)))
						}));
					}
				} else {
					let mut content: Vec<u8> = Vec::new();
					if file.read_to_end(&mut content).is_ok() {
						tasks.push(spawn(async move {
							if let Some(parent) = path.parent() {
								let _ = create_dir_all(parent);
							}
							write(path, content).await?;
							Ok(None)
						}));
					}
				}
			}
			Ok(())
		});
		Ok(tasks)
	}
	pub fn read<P: AsRef<Path>> (
		path: P,
		mut callback: impl FnMut(usize, String, ZipFile) -> Result<(), Error>
	) -> Result<ZipArchive, Error> {
		let file: File = File::open(path)?;
		let mut archive: ZipArchive = Archive::new(file)?;
		for i in 0..archive.len() {
			let file: ZipFile<'_> = archive.by_index(i)?;
			if !file.is_dir() {
				let name: String = String::from(file.name());
				let _ = callback(i, name, file);
			}
		}
		Ok(archive)
	}
	pub fn name (&self) -> String {
		String::from(&self.name)
	}
	pub fn pics (&self) -> Vec<(u32, usize)> {
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
	pub fn archive (self) -> ZipArchive {
		self.archive
	}
}