use super::*;
pub async fn config (path: &Path, config: &Vec<(String, String)>) -> (System, Resource, LFList, Server, Room, SetCode, Vec<JoinHandle<Result<(), Error>>>) {
	let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
	let config_path: PathBuf = path
		.join("config");
	WalkDir::new(&config_path)
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
						} else if file.name() == "room_room.toml" {
							let text: String = read_to_string(i.path()).await?;
							Ok(FileContent::Room(text))
						} else if file.name() == "extra_code.toml" {
							let text: String = read_to_string(i.path()).await?;
							Ok(FileContent::ExCode(text))
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
	let mut setcodes: Option<SetCode> = None;
	let mut servers: Server = Server::new();
	let mut lflist: LFList = LFList::new();
	let mut room: Room = Room::new();

	let mut tasks: FuturesUnordered<JoinHandle<Result<FileContent, Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
	while let Some(task) = tasks.next().await {
		if let Ok(task) = task {
			if let Ok(task) = task {
				match task {
					FileContent::System(text) => {
						system.get_or_insert_with(|| System::new(text).init());
					}
					FileContent::Resource(text) => {
						resources.get_or_insert_with(|| Resource::new(text));
					}
					FileContent::Servers(text) => {
						servers.init_by_toml(text)
					}
					FileContent::LFList(text) => {
						lflist.init(text)
					}
					FileContent::Room(text) => {
						room.init(text)
					}
					FileContent::ExCode(text) => {
						setcodes.get_or_insert_with(|| SetCode::new(text));
					}
					_ => ()
				};
			}
		}
	}
	let mut resources: Resource = resources.unwrap_or_else(|| { Resource::default() });
	let mut setcodes: SetCode = setcodes.unwrap_or_else(|| { SetCode::default() });
	let mut tasks: Vec<JoinHandle<Result<(), Error>>> = Vec::new();
	if let Some((_, text)) = config
		.iter()
		.find(|i| i.0.ends_with("resource.toml"))
		&& resources.merge(text) {
		let p: PathBuf = config_path
			.join("resource.toml");
		if let Ok(text) = resources.to_string() {
			tasks.push(spawn(async move {
				write(p, text)?;
				Ok(())
			}));
		}
	}
	if let Some((_, text)) = config
		.iter()
		.find(|i| i.0.ends_with("extra_code.toml"))
		&& setcodes.merge(text) {
		let p: PathBuf = config_path
			.join("extra_code.toml");
		let text: String = setcodes.to_string();
		tasks.push(spawn(async move {
			write(p, text)?;
			Ok(())
		}));
	}
	if let Some((_, text)) = config
		.iter()
		.find(|i| i.0.ends_with("servers.toml"))
		&& servers.merge(text) {
		let p: PathBuf = config_path
			.join("servers.toml");
		if let Ok(text) = servers.to_string() {
			tasks.push(spawn(async move {
				write(p, text)?;
				Ok(())
			}));
		}
	}
	if let Some((_, text)) = config
		.iter()
		.find(|i| i.0.ends_with("room_room.toml"))
		&& room.merge(text) {
		let p: PathBuf = config_path
			.join("room_room.toml");
		if let Ok(text) = room.to_string() {
			tasks.push(spawn(async move {
				write(p, text)?;
				Ok(())
			}));
		}
	}
	let system: System = match system {
		Some(system) => system,
		None => {
			let system: System = System::default().init();
			let p: PathBuf = config_path
				.join("system.toml");
			let text: String = system.to_string();
			tasks.push(spawn(async move {
				write(p, text)?;
				Ok(())
			}));
			system
		}
	};
	(system, resources, lflist, servers, room, setcodes, tasks)
}

pub async fn i18n (path: &Path, i18n: String, config: &Vec<(String, String)>) -> (CardInfo, Cdb, Strings, JoinHandle<Result<(), Error>>) {
	let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
	let info_name: String = format!("cardinfo-{}.toml", i18n);
	let p: PathBuf = path.join("strings").join(format!("strings-{}.conf", i18n));
	tasks.push(spawn(async move {
		let text: String = read_to_string(p).await?;
		Ok(FileContent::Strings(text))
	}));
	let info: PathBuf = path.join("config").join(&info_name);
	let info_path: PathBuf = info.clone();
	tasks.push(spawn(async move {
		let text: String = read_to_string(info_path).await?;
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
	let mut card_info: CardInfo = card_info.unwrap_or_else(|| { CardInfo::default() });
	let db: Cdb = db.unwrap_or_else(|| { Cdb::new() });
	if let Some((_, text)) = config
		.iter()
		.find(|i| i.0.ends_with(&info_name)) {
		card_info.merge(text);
	}

	if let Ok(text) = card_info.to_string() {
		(card_info, db, strings, spawn(async move {
			write(info, text)?;
			Ok(())
		}))
	} else {
		(card_info, db, strings, spawn(async {
			Ok(())
		}))
	}
}

pub async fn expansion (path: &Path, system: &System) -> IndexMap<String, GamePack> {
	let mut zip_tasks: Vec<JoinHandle<Result<Zip, Error>>> = Vec::new();
	let mut tasks: Vec<JoinHandle<Result<FileContent, Error>>> = Vec::new();
	WalkDir::new(path.join("expansions"))
		.max_depth(1)
		.into_iter()
		.for_each(|i| {
			if let Ok(i) = i {
				if let Some(file) = File::new(i.path()) {
					let file_name: String = String::from(file.name());
					if system
						.array()
						.get("LOADING_EXPANSION")
						.unwrap_or(&Vec::new())
						.contains(&file_name) {
						zip_tasks.push(Zip::new(String::from(file.path()), file_name));
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
						let mut scripts: Script = Script::new();
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
							pics.insert(*k, PicContent::ZipFile(*v));
						});
						zip.scripts().into_iter().for_each(|(k, v)| {
							scripts.insert(k.clone(), ScriptContent::ZipFile(*v));
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
							strings,
							db,
							server,
							lflist,
							scripts,
							pics,
							archive: Some(zip.archive())
						});
					}
				}
			}
		},
		async {
			let mut strings: Strings = Strings::new();
			let mut server: Server = Server::new();
			let mut lflist: LFList = LFList::new();
			let mut db: Cdb = Cdb::new();
			while let Some(task) = tasks.next().await {
				if let Ok(task) = task {
					if let Ok(file) = task {
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
					}
				}
			}
			GamePack {
				on: true,
				card_info: CardInfo::default(),
				strings,
				db,
				server,
				lflist,
				scripts: Script::new().read_dir(path.join("expansions").join("script")),
				pics: Pic::new().read_dir(path.join("expansions").join("pics")),
				archive: None
			}
		}
	);
	packs.insert(String::from("./expansions"), gamepack);
	packs
}

pub async fn zip (app: &AppHandle, name: String) -> Result<(), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write();
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
		let mut scripts: Script = Script::new();
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
			pics.insert(*k, PicContent::ZipFile(*v));
		});
		zip.scripts().into_iter().for_each(|(k, v)| {
			scripts.insert(k.clone(), ScriptContent::ZipFile(*v));
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
			db: Cdb::new(),
			strings,
			server,
			lflist,
			pics,
			scripts,
			archive: Some(zip.archive())
		});
		progress::emit(app, Event::End, 0);
	}
	Ok(())
}
