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
use strings::Strings;
use system::System;
use server::Server;
use card::Card;
use pic::Pic;
use zip::Zip;
use textures::Textures;
use font::Font;
use sound::Sound;
use card_info::CardInfo;
use lflist::LFList;
use file::{File, FileContent};

use serde::{Serialize, Deserialize};
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
	strings: Vec<(String, Strings)>,
	cards: Vec<(String, (Vec<i64>, Vec<String>))>,
	pics: Vec<(i64, String)>,
	system: (Vec<(String, String)>, Vec<(String, f64)>, Vec<(String, Vec<String>)>),
	textures: Vec<(String, String)>,
	sound: Vec<(String, String)>,
	font: Vec<(String, String)>,
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

	pub async fn init (app: AppHandle, path: String) -> Result<(), Error> {
		let start = std::time::Instant::now();
		let path: &Path = Path::new(&path);
		let mut pics: Pic = Pic::new();
		let mut font: Font = Font::new();
		let mut sound: Sound = Sound::new();

		let ((system, textures), _, _) = join!(
			Self::load_config(&path),
			font.read_dir(path.join("font")),
			sound.read_dir(path.join("sound"))
		);

		let lflist: LFList = LFList::new();
		let (lflist) = Self::load_expansion(path, lflist, &system).await;
		let (strings, lflist): (Vec<Strings>, LFList) = Self::load_card(path, lflist).await;

		
		pics.read_dir(path.join("expansions").join("pics"));
		pics.read_dir(path.join("pics"));
		let duration = start.elapsed();
		println!("执行时间: {:?}", duration);
		Ok(())
	}

	async fn load_config (path: &Path) -> (System, Textures) {
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
							} else {
								let text: String = read_to_string(i.path()).await?;
								Ok(FileContent::CardInfo((String::from(file.name()), text)))
							}
						}));
					}
				}
			});
		let mut system: Vec<System> = Vec::new();
		let mut textures: Vec<Textures> = Vec::new();
		let mut servers: Vec<Server> = Vec::new();
		let mut card_info: Vec<CardInfo> = Vec::new();

		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(task) = task {
					match task {
						FileContent::System(text) => system.push(System::new(text)),
						FileContent::Textures(text) => textures.push(Textures::new(text, &path.join("textures"))),
						FileContent::Servers(text) => servers.push(Server::new(text)),
						FileContent::CardInfo((name, text)) => card_info.push(CardInfo::new(text, name)),
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
		(system, textures)
	}

	async fn load_card (path: &Path, mut lflist: LFList) -> (Vec<Strings>, LFList) {
		let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
		WalkDir::new(path.join("strings"))
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if file.ext() == "conf" && file.name().starts_with("strings-") {
							tasks.push(spawn(async move {
								let text = read_to_string(i.path()).await?;
								Ok(FileContent::CardInfo((String::from(file.name()), text)))
							}));
						}
					}
				}
			});
		let mut strings: Vec<Strings> = Vec::new();

		let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(task) = task {
					match task {
						FileContent::Strings((name, text)) => strings.push(Strings::new(name).init(text)),
						FileContent::LFList(text) => lflist.init(text),
						_ => ()
					};
				}
			}
		}
		(strings, lflist)
	}

	async fn load_expansion (path: &Path, mut lflist: LFList, system: &System) -> (LFList) {
		let mut tasks: Vec<JoinHandle<Result<Zip, Error>>> = Vec::new();
		WalkDir::new(path.join("expansions"))
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if system
							.array()
							.get("LOADING_EXPANSION")
							.unwrap_or(&Vec::new())
							.contains(&String::from(file.name())) {
							tasks.push(Zip::new(String::from(file.path())));
						}
					}
				}
			});
		(lflist)
	}
}