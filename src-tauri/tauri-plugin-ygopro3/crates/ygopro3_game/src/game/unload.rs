use super::*;

pub async fn zip (name: String) -> Result<(), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!(""))?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write();
	if let Some((_, pack)) = game.pack
		.iter_mut()
		.find(|i| i.0 == &name) {
		pack.on = false;
	}
	Ok(())
}
