mod windbot;
use windbot::*;

use ygopro3_const::RESOURCE_PATH;

use anyhow::{Error, Result, anyhow};
use std::path::PathBuf;
use tokio::sync::OnceCell;
use serde_json::from_str;

static BOT: OnceCell<WindBot> = OnceCell::const_new();

pub async fn init () -> Result<(), Error> {
	let path: &PathBuf = RESOURCE_PATH.get().ok_or(anyhow!("get path error"))?;
	if BOT.get().is_none() {
		BOT.set(WindBot::new(path)?)?;
	}
	Ok(())
}

pub async fn start (args: String, i18n: String, deck: String) -> Result<(), Error> {
	init().await?;
	let bot: &WindBot = BOT.get().ok_or(anyhow!("get bot error"))?;
	let path: &PathBuf = RESOURCE_PATH.get().ok_or(anyhow!("get path error"))?;
	let db_path: PathBuf = path
		.join("cdb")
		.join(format!("cards-{}.cdb", i18n));
	let db_path: String = db_path.to_string_lossy().into_owned();
	let db_path: &str = db_path.strip_prefix(r"\\?\").unwrap_or(&db_path);
	let args: String = if deck.is_empty() {
		format!("DbPath={} {}", db_path, args)
	} else {
		let deck_path: PathBuf = path
			.join("deck")
			.join(deck);
		let deck_path: String = deck_path.to_string_lossy().into_owned();
		let deck_path: &str = deck_path.strip_prefix(r"\\?\").unwrap_or(&deck_path);
		format!("DbPath={} {} DeckFile={}", db_path, args, deck_path)
	};
	bot.start_bot(args);
	Ok(())
}

pub async fn stop () -> Result<(), Error> {
	let bot: &WindBot = BOT.get().ok_or(anyhow!("get bot error"))?;
	bot.shutdown()
}

pub async fn list () -> Result<Vec<[String; 3]>, Error> {
	init().await?;
	let bot: &WindBot = BOT.get().ok_or(anyhow!("get bot error"))?;
	let list: String = bot.get_list();
	let list: Vec<[String; 3]> = from_str(&list)?;
	Ok(list)
}