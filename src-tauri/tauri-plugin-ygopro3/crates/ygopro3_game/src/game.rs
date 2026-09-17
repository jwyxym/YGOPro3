use super::*;
pub mod load;
pub mod unload;

#[derive(Debug)]
pub struct Game {
	pub version: String,
	pub room: Room,
	pub system: System,
	pub resource: Resource,
	pub sound: Sound,
	pub ex_code: SetCode,
	pub pack: IndexMap<String, GamePack>
}

#[derive(Debug)]
pub struct GamePack {
	pub on: bool,
	pub card_info: CardInfo,
	pub strings: Strings,
	pub db: Cdb,
	pub server: Server,
	pub lflist: LFList,
	pub pics: Pic,
	pub scripts: Script,
	pub archive: Option<ZipArchive>
}


impl Game {
	pub async fn unzip (overwrite: bool) -> Result<Vec<(String, String)>, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let resource_path: &PathBuf = RESOURCE_PATH.get().ok_or(anyhow!("get path error"))?;
		let assets: PathBuf = resource_path.join("assets");
		metadata(&assets)?;
		let version: String = progress::app()
			.ok_or(anyhow!("get app error"))?
			.package_info()
			.version
			.to_string();
		let cache: String = read_to_string(path.join("cache"))
			.await
			.unwrap_or(String::new());
		let mut result: Vec<(String, String)> = Vec::new();
		if version != cache || overwrite {
			let mut tasks: Vec<JoinHandle<Result<Option<(String, String)>, Error>>> = Zip::unzip(path, &assets).await?;
			tasks.push(spawn(async {
				write(path
					.join("cache"), 
					version
				)?;
				Ok(None)
			}));
			progress::emit(Event::Progress, 1);
			for task in tasks {
				progress::emit(Event::Progress, 1);
				if let Some(i) = task.await?? {
					result.push(i)
				}
			}
		}
		Ok(result)
	}

	pub async fn init (overwrite: bool) -> Result<Self, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let (i, _) = join!(
			Self::unzip(overwrite),
			create_dir_all(path.join("config"))
		);
		
		let config: Vec<(String, String)> = i?;
		if config.len() == 0 {
			progress::emit(Event::Start, 5);
		}
		progress::emit(Event::Progress, 1);

		let (system, resource, lflist, server, room, setcode, mut tasks) = load::config(path, &config).await;
		progress::emit(Event::Progress, 1);
		
		let (mut pack, (card_info, db, strings, task)) = join!(
			load::expansion(path, &system),
			load::i18n(path, system.i18n(), &config)
		);
		let db: Cdb = db.add_ex_code(setcode.code());
		progress::emit(Event::Progress, 1);

		tasks.push(task);
		for i in vec!["deck", "expansions", "replay", "plugin"] {
			tasks.push(spawn(async move {
				Ok(create_dir_all(path.join(i)).await?)
			}));
		}
		for task in tasks {
			let _ = task.await;
		}
		progress::emit(Event::Progress, 1);

		let scripts: Script = Script::new();
		let pics: Pic = Pic::new().read_dir(path.join("pics"));
		let sound: Sound = Sound::new().read_dir(path.join("sound"), resource.sound());
		progress::emit(Event::Progress, 1);
		
		pack.insert(String::from("./"), GamePack {
			on: true,
			card_info,
			strings,
			db,
			server,
			lflist,
			scripts,
			pics,
			archive: None
		});
		progress::emit(Event::End, 0);
		Ok(Self {
			version: format!(
				"YGOPro3://{}",
				progress::app()
					.ok_or(anyhow!("get app error"))?
					.package_info()
					.version
					.to_string()
			),
			room: room,
			system: system,
			sound: sound,
			resource: resource,
			ex_code: setcode,
			pack: pack
		})
	}
}