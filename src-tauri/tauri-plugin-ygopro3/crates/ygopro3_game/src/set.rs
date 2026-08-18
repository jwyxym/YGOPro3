use super::*;

pub async fn system (key: String, ct: i8, value: String, w: bool) -> Result<(), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write();
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
