mod strings;
mod system;
mod server;
mod cdb;
mod pic;
mod zip;
mod resource;
mod font;
mod sound;
mod card_info;
mod lflist;
mod model;
mod request;
mod file;
pub use self::{
	card_info::CardInfo,
	cdb::Cdb,
	file::{File, FileContent},
	font::Font,
	lflist::LFList,
	pic::{Pic, PicContent},
	resource::{Resource, Textures},
	server::Server,
	sound::Sound,
	strings::Strings,
	system::System,
	model::Model,
	request::{Request, Srv},
	zip::Zip
};

use serde::Serialize;
use anyhow::{Error, Result, anyhow};
use regex::Regex;
use walkdir::WalkDir;
use lazy_static::lazy_static;
use indexmap::IndexMap;
use tokio::{
	task::{JoinHandle, spawn},
	fs::{read_to_string, metadata},
	sync::{OnceCell, RwLock, RwLockReadGuard, RwLockWriteGuard},
	join
};
use futures::{StreamExt, stream::FuturesUnordered};
use chrono::{DateTime, Utc};
use std::{
	collections::BTreeMap, fs::{exists, write}, path::{Path, PathBuf}, sync::OnceLock
};
use tauri::{AppHandle, Emitter};

static GAME: OnceCell<RwLock<Game>> = OnceCell::const_new();
pub static PATH: OnceLock<PathBuf> = OnceLock::new();

const URL_DOWNLOAD: &str = "https://api.gitcode.com/api/v5/repos/jwyxym/tauri-ygo/releases/release-latest/attach_files/assets.zip/download";
const URL_ASSETS_VERSION: &str = "https://api.gitcode.com/api/v5/repos/jwyxym/tauri-ygo/releases/release-latest/attach_files/version.txt/download";
const URL_GAME_VERSION: &str = "https://api.gitcode.com/api/v5/repos/jwyxym/tauri-ygo/releases/release-latest/attach_files/game_version.txt/download";

pub async fn init (app: &AppHandle) -> Result<(), Error> {
	if !GAME.get().is_some() {
		let game: RwLock<Game> = RwLock::new(Game::init(app, false).await?);
		GAME.set(game)?;
	}
	Ok(())
}
pub async fn reload (app: &AppHandle, overwrite: bool) -> Result<(), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write().await;
	*game = Game::init(app, overwrite).await?;
	Ok(())
}

pub async fn download (app: &AppHandle) -> Result<(), Error> {
	let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
	Request::download(app, path, URL_DOWNLOAD, "assets").await?;
	Ok(())
}

lazy_static! {
	pub static ref PIC_REGEX: Regex = Regex::new(r"^pics/(\d+)\.(jpg|png|jpeg)$").unwrap();
	pub static ref COMMENTS_REGEX: Regex = Regex::new(r"#.*").unwrap();
}

#[derive(Serialize, Clone, Debug)]
pub struct Game {
	version: (String, String),
	model: Model,
	system: System,
	resource: Resource,
	font: Font,
	sound: Sound,
	pack: IndexMap<String, GamePack>
}

#[derive(Serialize, Clone, Debug)]
pub struct GamePack {
	on: bool,
	card_info: CardInfo,
	strings: Strings,
	db: Cdb,
	server: Server,
	lflist: LFList,
	pics: Pic
}

impl Game {
	pub async fn unzip (app: &AppHandle, overwrite: bool) -> Result<String, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		metadata(path.join("assets")).await?;
		let (version, tasks) = Zip::unzip(app, path, overwrite).await?;
		for task in tasks {
			let _ = task.await;
		}
		version.ok_or(anyhow!("version error"))
	}

	pub async fn init (app: &AppHandle, overwrite: bool) -> Result<Self, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let version: String = Self::unzip(app, overwrite).await?;

		let mut font: Font = Font::new();
		let mut sound: Sound = Sound::new();

		let (system, resource, lflist, servers, model) = Self::load_config(path).await;

		let (mut pack, (card_info, db, strings), _, _) = join!(
			Self::load_expansion(app, path, &system),
			Self::load_i18n(path, system.i18n()),
			font.read_dir(path.join("font"), resource.font()),
			sound.read_dir(path.join("sound"), resource.sound())
		);
		pack.insert(String::from("./"), GamePack {
			on: true,
			card_info: card_info,
			strings:  strings,
			db: db,
			server: servers,
			lflist: lflist,
			pics: Pic::new().read_dir(path.join("pics"))
		});
		pack.reverse();
		Ok(Self {
			version: (format!("YGOPro3://{}/", app.package_info().version.to_string()), version),
			model: model,
			system: system,
			resource: resource,
			font: font,
			sound: sound,
			pack: pack
		})
	}

	async fn load_config (path: &Path) -> (System, Resource, LFList, Server, Model) {
		let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
		WalkDir::new(path.join("config"))
			.max_depth(1)
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						tasks.push(spawn(async move {
							if file.name() == "system.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::System(text))
							} else if file.name() == "resource.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::Resource(text))
							} else if file.name() == "servers.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::Servers(text))
							} else if file.name() == "room_model.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::Model(text))
							} else {
								Err(anyhow!(""))
							}
						}));
					}
				}
			});
		let p: PathBuf = path.join("lflist.conf");
		tasks.push(spawn(async move {
			let text: String = read_to_string(p).await?;
			Ok(FileContent::LFList(text))
		}));
		let mut system: Option<System> = None;
		let mut resources: Option<Resource> = None;
		let mut servers: Server = Server::new();
		let mut lflist: LFList = LFList::new();
		let mut model: Model = Model::new();

		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(task) = task {
					match task {
						FileContent::System(text) => {
							system.get_or_insert_with(|| System::new(text));
						}
						FileContent::Resource(text) => {
							resources.get_or_insert_with(|| Resource::new(text, &path.join("textures")));
						}
						FileContent::Servers(text) => {
							servers.init_by_toml(text)
						}
						FileContent::LFList(text) => {
							lflist.init(text)
						}
						FileContent::Model(text) => {
							model.init(text)
						}
						_ => ()
					};
				}
			}
		}
		let system: System = system.unwrap_or_else(|| { System::default() });
		let resources: Resource = resources.unwrap_or_else(|| { Resource::default() });
		(system, resources, lflist, servers, model)
	}

	async fn load_i18n (path: &Path, i18n: String) -> (CardInfo, Cdb, Strings) {
		let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
		let p: PathBuf = path.join("strings").join(format!("strings-{}.conf", i18n));
		tasks.push(spawn(async move {
			let text: String = read_to_string(p).await?;
			Ok(FileContent::Strings(text))
		}));
		let p: PathBuf = path.join("config").join(format!("cardinfo-{}.toml", i18n));
		tasks.push(spawn(async move {
			let text: String = read_to_string(p).await?;
			Ok(FileContent::CardInfo(text))
		}));
		let p: PathBuf = path.join("cdb").join(format!("cards-{}.cdb", i18n));
		tasks.push(spawn(async move {
			let mut db: Cdb = Cdb::new();
			db.init(p).await?;
			Ok(FileContent::Cdb(db))
		}));
		let mut strings: Strings = Strings::new();
		let mut card_info: Option<CardInfo> = None;
		let mut db: Option<Cdb> = None;
		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(file) = task {
					match file {
						FileContent::CardInfo(text) => {
							card_info.get_or_insert_with(|| CardInfo::new(text));
						}
						FileContent::Strings(text) => {
							strings.init(text);
						}
						FileContent::Cdb(card) => {
							db.get_or_insert_with(|| card);
						}
						_ => ()
					}
				}
			}
		}
		let card_info: CardInfo = card_info.unwrap_or_else(|| { CardInfo::default() });
		let db: Cdb = db.unwrap_or_else(|| { Cdb::new() });
		(card_info, db, strings)
	}

	async fn load_expansion (app: &AppHandle, path: &Path, system: &System) -> IndexMap<String, GamePack> {
		let mut zip_tasks: Vec<JoinHandle<Result<Zip, Error>>> = Vec::new();
		let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
		WalkDir::new(path.join("expansions"))
			.max_depth(1)
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if system
							.array()
							.get("LOADING_EXPANSION")
							.unwrap_or(&Vec::new())
							.contains(&String::from(file.name())) {
							zip_tasks.push(Zip::new(String::from(file.path()), String::from(file.name())));
						} else if file.ext() == "cdb" {
							tasks.push(spawn(async move {
								let mut db: Cdb = Cdb::new();
								db.init(file.path()).await?;
								Ok(FileContent::Cdb(db))
							}));
						} else if file.name().ends_with("strings.conf") {
							tasks.push(spawn(async move {
								let text: String = read_to_string(file.path()).await?;
								Ok(FileContent::Strings(text))
							}));
						} else if file.name().ends_with("lflist.conf") {
							tasks.push(spawn(async move {
								let text: String = read_to_string(file.path()).await?;
								Ok(FileContent::LFList(text))
							}));
						} else if file.name().ends_with("servers.conf") {
							tasks.push(spawn(async move {
								let text: String = read_to_string(file.path()).await?;
								Ok(FileContent::ServersConf(text))
							}));
						} else if file.ext() == "ini" {
							tasks.push(spawn(async move {
								let text: String = read_to_string(file.path()).await?;
								Ok(FileContent::ServersIni(text))
							}));
						}
					}
				}
			});
		let mut packs: IndexMap<String, GamePack> = IndexMap::new();
		let mut zip_tasks: FuturesUnordered<JoinHandle<Result<Zip, Error>>> = zip_tasks.into_iter().collect::<FuturesUnordered<_>>();
		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		let _ = app.emit("started", zip_tasks.len() + tasks.len());
		let (_, gamepack) = join!(
			async {
				while let Some(task) = zip_tasks.next().await {
					let _ = app.emit("progress", 1);
					if let Ok(task) = task {
						if let Ok(zip) = task {
							let mut lflist: LFList = LFList::new();
							let mut strings: Strings = Strings::new();
							let mut db: Cdb = Cdb::new();
							let mut server: Server = Server::new();
							let mut pics: Pic = Pic::new();
							zip.lflist().into_iter().for_each(|text: String| {
								lflist.init(text);
							});
							zip.strings().into_iter().for_each(|text: String| {
								strings.init(text.clone());
							});
							zip.db().into_iter().for_each(|i| {
								db.init_by_db(i);
							});
							zip.pics().into_iter().for_each(|(k, v)| {
								pics.insert(k, PicContent::Buffer(v.clone()));
							});
							zip.servers().into_iter().for_each(|text: String| {
								server.init_by_conf(text);
							});
							zip.ini().into_iter().for_each(|text: String| {
								server.init_by_ini(text);
							});
							packs.insert(zip.name(), GamePack {
								on: true,
								card_info: CardInfo::default(),
								strings: strings,
								db: db,
								server: server,
								lflist: lflist,
								pics: pics
							});
						}
					}
				}
			},
			async {
				while let Some(task) = tasks.next().await {
					let _ = app.emit("progress", 1);
					if let Ok(task) = task {
						if let Ok(file) = task {
							let mut strings: Strings = Strings::new();
							let mut server: Server = Server::new();
							let mut lflist: LFList = LFList::new();
							let mut db: Cdb = Cdb::new();
							match file {
								FileContent::Strings(text) => {
									strings.init(text);
								}
								FileContent::Cdb(card) => {
									db.init_by_db(card);
								}
								FileContent::LFList(text) => {
									lflist.init(text)
								}
								FileContent::ServersConf(text) => {
									server.init_by_conf(text);
								}
								FileContent::ServersIni(text) => {
									server.init_by_ini(text);
								}
								_ => ()
							}
							return GamePack {
								on: true,
								card_info: CardInfo::default(),
								strings: strings,
								db: db,
								server: server,
								lflist: lflist,
								pics: Pic::new().read_dir(path.join("expansions").join("pics"))
							};
						}
					}
				}
				GamePack {
					on: true,
					card_info: CardInfo::default(),
					strings: Strings::new(),
					db: Cdb::new(),
					server: Server::new(),
					lflist: LFList::new(),
					pics: Pic::new().read_dir(path.join("expansions").join("pics"))
				}
			}
		);
		packs.insert(String::from("./expansions"), gamepack);
		let _ = app.emit("end", 0);
		packs
	}

	pub async fn unload_zip (name: String) -> Result<(), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let mut game: RwLockWriteGuard<'_, Game> = game.write().await;
		if let Some((_, pack)) = game.pack
			.iter_mut()
			.find(|i| i.0 == &name) {
			pack.on = false;
		}
		Ok(())
	}

	pub async fn load_zip (app: &AppHandle, name: String) -> Result<(), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let mut game: RwLockWriteGuard<'_, Game> = game.write().await;
		if let Some((_, pack)) = game.pack
			.iter_mut()
			.find(|i| i.0 == &name) {
			pack.on = true;
		} else {
			let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
			let path: PathBuf = path.join("expansions").join(&name);
			let path: &str = path
				.as_os_str()
				.to_str()
				.ok_or(anyhow!("get path error"))?;
			let zip: Zip = Zip::new_with_emit(app, String::from(path), name.clone())?;
			let mut lflist: LFList = LFList::new();
			let mut strings: Strings = Strings::new();
			let mut db: Vec<Cdb> = Vec::new();
			let mut server: Server = Server::new();
			let mut pics: Pic = Pic::new();
			zip.lflist().into_iter().for_each(|text: String| {
				lflist.init(text);
			});
			zip.strings().into_iter().for_each(|text: String| {
				strings.init(text.clone());
			});
			zip.db().into_iter().for_each(|i| {
				db.push(i);
			});
			zip.pics().into_iter().for_each(|(k, v)| {
				pics.insert(k, PicContent::Buffer(v.clone()));
			});
			zip.servers().into_iter().for_each(|text: String| {
				server.init_by_conf(text);
			});
			zip.ini().into_iter().for_each(|text: String| {
				server.init_by_ini(text);
			});
			game.pack.insert(name, GamePack {
				on: true,
				card_info: CardInfo::default(),
				strings:  strings,
				db: Cdb::new(),
				server: server,
				lflist: lflist,
				pics: pics
			});
			app.emit("end", 0)?;
		}
		Ok(())
	}

	pub async fn get_pic (deck: Vec<u32>) -> Result<(Vec<(u32, String)>, Vec<(u32, Vec<u8>)>), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let mut buffer: BTreeMap<u32, Vec<u8>> = BTreeMap::new();
		let mut path: BTreeMap<u32, String> = BTreeMap::new();
		game.pack
			.clone()
			.into_values()
			.filter(|pack: &GamePack| pack.on)
			.for_each(|pack: GamePack| {
				pack.pics.to_array().into_iter().for_each(|(k, v)| {
					if deck.contains(&k) {
						match v {
							PicContent::Buffer(v) => {
								buffer.insert(k, v.clone());
							}
							PicContent::Path(v) => {
								path.insert(k, v.clone());
							}
						}
					}
				});
			});
		let buffer: Vec<(u32, Vec<u8>)> = buffer.into_iter().collect();
		let path: Vec<(u32, String)> = path.into_iter().collect();
		Ok((path, buffer))
	}

	pub async fn get_font () -> Result<Vec<(String, Vec<u8>)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.font.to_array())
	}

	pub async fn get_sound () -> Result<Vec<(String, Vec<u8>)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.sound.to_array())
	}

	pub async fn get_textures () -> Result<Textures, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.resource.to_array())
	}

	pub async fn get_cards () -> Result<Vec<(Vec<u32>, Vec<String>)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let mut cards: BTreeMap<u32, (Vec<u32>, Vec<String>)> = BTreeMap::new();
		game.pack
			.clone()
			.into_values()
			.filter(|pack: &GamePack| pack.on)
			.for_each(|pack: GamePack| {
				pack.db.content().into_iter().for_each(|(k, v)| {
					cards.insert(*k, v.clone());
				});
			});
		Ok(cards.values().cloned().collect())
	}

	pub async fn get_system () -> Result<(Vec<(String, String)>, Vec<(String, bool)>, Vec<(String, f64)>, Vec<(String, Vec<String>)>), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.system.to_array())
	}

	pub async fn get_server () -> Result<Vec<(String, String)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let mut servers: BTreeMap<String, String> = BTreeMap::new();
		game.pack
			.clone()
			.into_values()
			.filter(|pack: &GamePack| pack.on)
			.rev()
			.for_each(|pack: GamePack| {
				pack.server.content().into_iter().for_each(|(k, v)| {
					servers.insert(String::from(k), String::from(v));
				});
			});
		Ok(servers.into_iter().collect())
	}

	pub async fn get_lflist () -> Result<Vec<(String, (u32, u32, Vec<(u32, u32)>, Vec<(u32, u32)>))>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let mut lflist: IndexMap<String, (u32, u32, Vec<(u32, u32)>, Vec<(u32, u32)>)> = IndexMap::new();
		game.pack
			.clone()
			.into_values()
			.filter(|pack: &GamePack| pack.on)
			.rev()
			.for_each(|pack: GamePack| {
				pack.lflist.content().into_iter().for_each(|(k, v)| {
					lflist.insert(String::from(k), v.to_array());
				});
			});
		Ok(lflist.into_iter().collect())
	}

	pub async fn get_strings () -> Result<(Vec<(u32, String)>, Vec<(u32, String)>, Vec<(u32, String)>, Vec<(u32, String)>), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let mut system: BTreeMap<u32, String> = BTreeMap::new();
		let mut victory: BTreeMap<u32, String> = BTreeMap::new();
		let mut counter: BTreeMap<u32, String> = BTreeMap::new();
		let mut setname: BTreeMap<u32, String> = BTreeMap::new();
		game.pack
			.clone()
			.into_values()
			.filter(|pack: &GamePack| pack.on)
			.rev()
			.for_each(|pack: GamePack| {
				pack.strings.system().into_iter().for_each(|(k, v)| {
					system.insert(*k, String::from(v));
				});
				pack.strings.victory().into_iter().for_each(|(k, v)| {
					victory.insert(*k, String::from(v));
				});
				pack.strings.counter().into_iter().for_each(|(k, v)| {
					counter.insert(*k, String::from(v));
				});
				pack.strings.setname().into_iter().for_each(|(k, v)| {
					setname.insert(*k, String::from(v));
				});
			});
		Ok((
			system.into_iter().collect(),
			victory.into_iter().collect(),
			counter.into_iter().collect(),
			setname.into_iter().collect()
		))
	}

	pub async fn get_info () -> Result<(
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>,
		Vec<(u32, String)>
	), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let (_, pack) = game.pack.first().ok_or(anyhow!(""))?;
		Ok(pack
			.clone()
			.card_info
			.to_array())
	}

	pub async fn get_model () -> Result<Vec<(String, String)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game
			.model
			.to_array())
	}

	pub async fn get_deck () -> Result<Vec<(String, String)>, Error> {
		let mut tasks: Vec<JoinHandle<Result<(String, String), Error>>> = Vec::new();
		let mut deck: Vec<(String, String)> = Vec::new();
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		WalkDir::new(path.join("deck"))
			.max_depth(1)
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						tasks.push(spawn(async move {
							let text: String = read_to_string(i.path()).await?;
							let name: &str = file.name();
							Ok((String::from(name), text))
						}));
					}
				}
			});
		let mut tasks: FuturesUnordered<JoinHandle<Result<(String, String), Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(i) = task {
					deck.push(i);
				}
			}
		}
		Ok(deck)
	}
	pub async fn set_system (key: String, ct: i8, value: String, w: bool) -> Result<(), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let mut game: RwLockWriteGuard<'_, Game> = game.write().await;
		game.system.set(key, ct, value)?;
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		if w {
			write(path
				.join("config")
				.join("system.toml"), 
				game.system.to_string()
			)?;
		}
		Ok(())
	}
	pub async fn chk_version () -> Result<(bool, bool), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(join!(
			Request::version(URL_GAME_VERSION, &game.version.0),
			Request::version(URL_ASSETS_VERSION, &game.version.1)
		))
	}
	pub async fn update (app: &AppHandle) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		Request::download(app, path, URL_DOWNLOAD, "assets").await?;
		Ok(())
	}
	pub async fn download (app: &AppHandle, url: String, name: String) -> Result<String, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		Request::download(app, path.join("expansions"), &url, &name).await
	}
	pub async fn get_time (p: Vec<String>) -> Result<String, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let mut path: PathBuf = path.clone();
		for i in p {
			path = path.join(&i);
		}
		if exists(&path)? {
			let time: DateTime<Utc> = metadata(path).await?.modified()?.into();
			Ok(time.to_rfc3339())
		} else {
			Ok(String::new())
		}
	}
}