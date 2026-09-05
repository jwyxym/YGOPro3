use super::*;
use super::game::*;

pub async fn pic (deck: Vec<u32>) -> Result<(Vec<(u32, String)>, Vec<(u32, Vec<u8>)>), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("get game error"))?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write();
	let mut buffer: BTreeMap<u32, Vec<u8>> = BTreeMap::new();
	let mut path: BTreeMap<u32, String> = BTreeMap::new();
	for pack in game.pack.values_mut() {
		if !pack.on {
			continue;
		}
		for (k, v) in pack.pics.to_array().into_iter() {
			if !deck.contains(&k)
				|| path.contains_key(&k)
				|| buffer.contains_key(&k) {
				continue;
			}
			match v {
				PicContent::ZipFile(v) => {
					if let Some(archive) = pack.archive.as_mut() {
						let mut content: Vec<u8> = Vec::new();
						if let Ok(mut file) = archive.by_index(v)
							&& file.read_to_end(&mut content).is_ok()
						{
							buffer.insert(k, content);
						}
					}
				}
				PicContent::Path(v) => {
					path.insert(k, v);
				}
			}
		}
	}
	let buffer: Vec<(u32, Vec<u8>)> = buffer.into_iter().collect();
	let path: Vec<(u32, String)> = path.into_iter().collect();
	Ok((path, buffer))
}

pub fn script (key: &str) -> Result<Vec<u8>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("get game error"))?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write();
	let mut content: Vec<u8> = Vec::new();
	for pack in game.pack.values_mut() {
		if !pack.on {
			continue;
		}
		if let Some(script) = pack.scripts.get(key) {
			match script {
				ScriptContent::ZipFile(index) => {
					if let Some(archive) = pack.archive.as_mut() {
						if let Ok(mut file) = archive.by_index(*index) {
							file.read_to_end(&mut content)?;
							break;
						}
					}
				}
				ScriptContent::Path(path) => {
					content = read(path)?;
					break;
				}
			}
		}
	};
	if content.len() == 0 {
		Err(anyhow!("cannot find script"))
	} else {
		Ok(content)
	}
}

pub async fn sound () -> Result<Vec<(String, String)>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	Ok(game.sound.to_array())
}

pub async fn textures () -> Result<Textures, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
	Ok(game.resource.to_array(&path.join("textures")))
}

pub async fn cards () -> Result<Vec<Card>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let mut cards: BTreeMap<u32, Card> = BTreeMap::new();
	game.pack
		.values()
		.for_each(|pack: &GamePack| {
			pack.db.content().into_iter().for_each(|(k, v)| {
				if pack.on && !cards.contains_key(k) {
					cards.insert(*k, v.clone());
				}
			});
		});
	Ok(cards.values().cloned().collect())
}
pub async fn system () -> Result<(Vec<(String, String)>, Vec<(String, bool)>, Vec<(String, f64)>, Vec<(String, Vec<String>)>), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	Ok(game.system.to_array())
}

pub async fn server () -> Result<Vec<(String, String)>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let mut servers: BTreeMap<String, String> = BTreeMap::new();
	game.pack
		.values()
		.filter(|pack: &&GamePack| pack.on)
		.rev()
		.for_each(|pack: &GamePack| {
			pack.server.content().into_iter().for_each(|(k, v)| {
				servers.insert(String::from(k), String::from(v));
			});
		});
	Ok(servers.into_iter().collect())
}

pub async fn lflist () -> Result<Vec<(String, (u32, u32, Vec<(u32, u32)>, Vec<(u32, u32)>))>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let mut lflist: IndexMap<String, (u32, u32, Vec<(u32, u32)>, Vec<(u32, u32)>)> = IndexMap::new();
	game.pack
		.values()
		.filter(|pack: &&GamePack| pack.on)
		.for_each(|pack: &GamePack| {
			pack.lflist.content().into_iter().for_each(|(k, v)| {
				lflist.insert(String::from(k), v.to_array());
			});
		});
	Ok(lflist.into_iter().collect())
}

pub async fn strings () -> Result<(Vec<(u32, String)>, Vec<(u32, String)>, Vec<(u32, String)>, Vec<(u32, String)>), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let mut system: BTreeMap<u32, String> = BTreeMap::new();
	let mut victory: BTreeMap<u32, String> = BTreeMap::new();
	let mut counter: BTreeMap<u32, String> = BTreeMap::new();
	let mut setname: BTreeMap<u32, String> = BTreeMap::new();
	game.pack
		.values()
		.filter(|pack: &&GamePack| pack.on)
		.rev()
		.for_each(|pack: &GamePack| {
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

pub async fn info () -> Result<(
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>,
	Vec<(u32, String)>
), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let pack: &GamePack = game.pack.get("./").ok_or(anyhow!(""))?;
	Ok(pack
		.card_info
		.clone()
		.to_array())
}

pub async fn room () -> Result<Vec<(String, String)>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	Ok(game
		.room
		.to_array())
}

pub async fn server_args () -> Result<(String, String), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let i18n: String = game.system.i18n();
	let array: [&str; 2] = ["./expansions", "./"];
	let pack: String = game.pack
		.iter()
		.filter_map(|i: (&String, &GamePack)| {
			if i.1.on && !array.contains(&i.0.as_str()) {
				Some(i.0.clone())
			} else {
				None
			}
		})
		.collect::<Vec<String>>()
		.join("/");
	Ok((i18n, pack))
}

pub async fn hash () -> Result<Vec<u8>, Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
	let hash: String = String::from(game.resource.recognizer()
		.get("hash").ok_or(anyhow!("no hash data"))?);
	let path: PathBuf = path
		.join("recognizer")
		.join(hash);
	Ok(read(path)?)
}
