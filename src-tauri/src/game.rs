mod strings;
mod system;
mod server;
mod card;
mod pic;
mod zip;
mod textures;
mod font;
mod sound;
mod card_info;
mod lflist;
mod file;
mod regex;
use crate::game::{
	strings::Strings,
	system::System,
	server::Server,
	card::Card,
	pic::{Pic, PicContent},
	zip::Zip,
	textures::Textures,
	font::Font,
	sound::Sound,
	card_info::CardInfo,
	lflist::LFList,
	file::{File, FileContent},
};

use serde::Serialize;
use anyhow::{Result, Error};
use walkdir::WalkDir;
use tokio::{
	task::{JoinHandle, spawn},
	fs::read_to_string,
	join
};
use futures::{stream::FuturesUnordered, StreamExt};
use tauri::{AppHandle, Emitter};
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone, Debug)]
pub struct Game {
	strings: Vec<Strings>,
	system: System,
	textures: Textures,
	lflist: LFList,
	card_info: CardInfo,
	server: Server,
	pics: Pic,
	cards: Vec<Card>
}

impl Game  {	
	pub async fn unzip (app: AppHandle, path: String, overwrite: bool) -> Result<(), Error> {
		let tasks: Vec<JoinHandle<Result<(), Error>>> = Zip::unzip(&app, path, overwrite).await?;
		let mut tasks: FuturesUnordered<JoinHandle<Result<(), Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(_) = tasks.next().await {
			app.emit("progress", 1)?;
		}
		app.emit("end", 0)?;
		Ok(())
	}

	pub async fn init (app: AppHandle, path: String) -> Result<Self, Error> {
		let start = std::time::Instant::now();
		println!("开始");
		
		let path: &Path = Path::new(&path);
		let mut font: Font = Font::new();
		let mut sound: Sound = Sound::new();

		let (game, cards, _, _) = join!(
			Self::load_config(path),
			Self::load_card(path),
			font.read_dir(path.join("font")),
			sound.read_dir(path.join("sound"))
		);

		let mut game: Game = Self::load_expansion(path, game).await;
		game.cards = cards;

		let duration = start.elapsed();
		println!("执行时间: {:?}", duration);
		Ok(game)
	}

	async fn load_config (path: &Path) -> Self {
		let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
		WalkDir::new(path.join("config"))
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						tasks.push(spawn(async move {
							if file.name() == "system.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::System(text))
							} else if file.name() == "textures.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::Textures(text))
							} else if file.name() == "servers.toml" {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::Servers(text))
							} else if file.ext() == "toml" && file.name().starts_with("cardinfo-") {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::CardInfo((String::from(file.name()), text)))
							} else {
								Ok(FileContent::None)
							}
						}));
					}
				}
			});
		WalkDir::new(path.join("strings"))
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if file.ext() == "conf" && file.name().starts_with("strings-") {
							tasks.push(spawn(async move {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::Strings((String::from(file.name()), text)))
							}));
						}
					}
				}
			});
		let p: PathBuf = path.join("lflist.conf");
		tasks.push(spawn(async move {
			let text: String = read_to_string(p).await?;
			Ok(FileContent::LFList(text))
		}));
		let mut strings: Vec<Strings> = Vec::new();
		let mut system: Vec<System> = Vec::new();
		let mut textures: Vec<Textures> = Vec::new();
		let mut card_info: Vec<CardInfo> = Vec::new();
		let mut servers: Server = Server::new();
		let mut lflist: LFList = LFList::new();
		let mut pics: Pic = Pic::new();

		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(task) = task {
					match task {
						FileContent::System(text) => system.push(System::new(text)),
						FileContent::Textures(text) => textures.push(Textures::new(text, &path.join("textures"))),
						FileContent::Servers(text) => servers.init_toml(text),
						FileContent::CardInfo((name, text)) => card_info.push(CardInfo::new(text, name)),
						FileContent::Strings((name, text)) => strings.push(Strings::new(name).init(text)),
						FileContent::LFList(text) => lflist.init(text),
						_ => ()
					};
				}
			}
		}
		let system: System = system
			.get(0)
			.cloned()
			.unwrap_or_else(|| { System::default() });
		let textures: Textures = textures
			.get(0)
			.cloned()
			.unwrap_or_else(|| { Textures::default() });
		let card_info: CardInfo = card_info
			.get(0)
			.cloned()
			.unwrap_or_else(|| { CardInfo::default() });
		pics.read_dir(path.join("pics"));
		pics.read_dir(path.join("expansions").join("pics"));
		Self {
			strings: strings,
			system: system,
			textures: textures,
			lflist: lflist,
			card_info: card_info,
			server: servers,
			pics: pics,
			cards: Vec::new()
		}
	}

	async fn load_expansion (path: &Path, mut game: Self) -> Self {
		let mut tasks: Vec<JoinHandle<Result<Zip, Error>>> = Vec::new();
		WalkDir::new(path.join("expansions"))
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if game.system
							.array()
							.get("LOADING_EXPANSION")
							.unwrap_or(&Vec::new())
							.contains(&String::from(file.name())) {
							tasks.push(Zip::new(String::from(file.path())));
						}
					}
				}
			});
		let mut tasks: FuturesUnordered<JoinHandle<Result<Zip, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		let mut strings: Vec<Strings> = Vec::new();
		let mut db: Vec<Vec<u8>> = Vec::new();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(zip) = task {
					zip.lflist().into_iter().for_each(|text: String| {
						game.lflist.init(text);
					});
					game.strings.iter().for_each(|i: &Strings| {
						zip.strings().into_iter().for_each(|text: String| {
							strings.push(i.clone().init(text.clone()));
						});
					});
					zip.db().into_iter().for_each(|i: Vec<u8>| {
						db.push(i.clone());
					});
					zip.pics().into_iter().for_each(|(k, v)| {
						game.pics.insert(k, PicContent::Buffer(v.clone()));
					});
					zip.servers().into_iter().for_each(|text: String| {
						game.server.init_conf(text);
					});
					zip.ini().into_iter().for_each(|text: String| {
						game.server.init_ini(text);
					});
					zip.lflist().into_iter().for_each(|text: String| {
						game.lflist.init(text);
					});
				}
			}
		}
		game.strings = strings;
		game
	}

	async fn load_card (path: &Path) -> Vec<Card> {
		let mut tasks: Vec<JoinHandle<Result<Card, Error>>> = Vec::new();
		WalkDir::new(path.join("cdb"))
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if file.ext() == "cdb" && file.name().starts_with("cards-") {
							tasks.push(spawn(async move {
								let mut db: Card = Card::new(String::from(file.name()));
								db.init(file.path()).await?;
								Ok(db)
							}));
						}
					}
				}
			});

		let mut dbs: Vec<Card> = Vec::new();
		let mut tasks: FuturesUnordered<JoinHandle<Result<Card, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(db) = task {
					dbs.push(db);
				}
			}
		}
		dbs
	}
}