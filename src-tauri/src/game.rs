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
mod file;
use crate::game::{
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
	zip::Zip
};

use serde::Serialize;
use anyhow::{Error, Result, anyhow};
use regex::Regex;
use walkdir::WalkDir;
use lazy_static::lazy_static;
use tokio::{
	task::{JoinHandle, spawn},
	fs::{read_to_string, metadata},
	sync::{OnceCell, RwLock, RwLockReadGuard},
	join
};
use futures::{stream::FuturesUnordered, StreamExt};
use std::{collections::BTreeMap, path::{Path, PathBuf}};

static GAME: OnceCell<RwLock<Game>> = OnceCell::const_new();
pub async fn init(path: String) -> Result<&'static RwLock<Game>, Error> {
	let game: RwLock<Game> = RwLock::new(Game::init(path).await?);
	Ok(GAME.get_or_init(|| async {
		game
	}).await)
}

lazy_static! {
	pub static ref PIC_REGEX: Regex = Regex::new(r"^pics/(\d+)\.(jpg|png|jpeg)$").unwrap();
	pub static ref COMMENTS_REGEX: Regex = Regex::new(r"#.*").unwrap();
}

#[derive(Serialize, Clone, Debug)]
pub struct Game {
	system: System,
	resource: Resource,
	font: Font,
	sound: Sound,
	pack: BTreeMap<String, GamePack>
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

impl Game  {
	pub async fn unzip<P: AsRef<Path>> (path: P, overwrite: bool) -> Result<(), Error> {
		metadata(path.as_ref().join("assets.zip")).await?;
		let tasks: Vec<JoinHandle<Result<(), Error>>> = Zip::unzip(path, overwrite).await?;
		for task in tasks {
			let _ = task.await;
		}
		Ok(())
	}

	pub async fn init (path: String) -> Result<Self, Error> {
		let path: &Path = Path::new(&path);
		Self::unzip( path, false).await?;

		let mut font: Font = Font::new();
		let mut sound: Sound = Sound::new();

		let (system, resource, lflist, servers) = Self::load_config(path).await;

		let (mut pack, (card_info, db, strings), _, _) = join!(
			Self::load_expansion(path, &system),
			Self::load_i18n(path, String::from(system.string().get("I18N").unwrap_or(&String::from("zh-CN")))),
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
		Ok(Self {
			system: system,
			resource: resource,
			font: font,
			sound: sound,
			pack: pack
		})
	}

	async fn load_config (path: &Path) -> (System, Resource, LFList, Server) {
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
							} else {
								Ok(FileContent::None)
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
						_ => ()
					};
				}
			}
		}
		let system: System = system.unwrap_or_else(|| { System::default() });
		let resources: Resource = resources.unwrap_or_else(|| { Resource::default() });
		(system, resources, lflist, servers)
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

	async fn load_expansion (path: &Path, system: &System) -> BTreeMap<String, GamePack> {
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
		let mut packs: BTreeMap<String, GamePack> = BTreeMap::new();
		let mut zip_tasks: FuturesUnordered<JoinHandle<Result<Zip, Error>>> = zip_tasks.into_iter().collect::<FuturesUnordered<_>>();
		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		let (_, gamepack) = join!(
			async {
				while let Some(task) = zip_tasks.next().await {
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
		packs
	}

	async fn load_zip (path: String, name: String) -> Result<GamePack, Error> {
		let zip: Zip = Zip::new(format!("{}/expansions/{}", path, name), name).await??;
		let mut lflist: LFList = LFList::new();
		let mut strings: Strings = Strings::new();
		let mut db = Vec::new();
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
		Ok(GamePack {
			on: true,
			card_info: CardInfo::default(),
			strings:  strings,
			db: Cdb::new(),
			server: server,
			lflist: lflist,
			pics: pics
		})
	}

	pub async fn get_pic () -> Result<(Vec<(u32, String)>, Vec<(u32, Vec<u8>)>), Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("GAME HAVENT INIT"))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		let mut buffer: BTreeMap<u32, Vec<u8>> = BTreeMap::new();
		let mut path: BTreeMap<u32, String> = BTreeMap::new();
		game.pack.clone().into_values().for_each(|pack: GamePack| {
			if pack.on {
				pack.pics.to_array().into_iter().for_each(|(k, v)| {
					match v {
						PicContent::Buffer(v) => {
							buffer.insert(k, v.clone());
						}
						PicContent::Path(v) => {
							path.insert(k, v.clone());
						}
					}
				});
			}
		});
		let buffer: Vec<(u32, Vec<u8>)> = buffer.into_iter().collect();
		let path: Vec<(u32, String)> = path.into_iter().collect();
		Ok((path, buffer))
	}

	pub async fn get_font () -> Result<Vec<(String, Vec<u8>)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("GAME HAVENT INIT"))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.font.to_array())
	}

	pub async fn get_sound () -> Result<Vec<(String, Vec<u8>)>, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("GAME HAVENT INIT"))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.sound.to_array())
	}

	pub async fn get_textures () -> Result<Textures, Error> {
		let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("GAME HAVENT INIT"))?;
		let game: RwLockReadGuard<'_, Game> = game.read().await;
		Ok(game.resource.to_array())
	}
}