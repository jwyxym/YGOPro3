mod windbot;
use windbot::*;

use ygopro3_const::RESOURCE_PATH;

use anyhow::{Error, Result, anyhow};
use std::path::PathBuf;
use tokio::sync::OnceCell;
use serde_json::{Map, Value, from_str, to_string};
use windbot_rs::Card;

static BOT: OnceCell<WindBot> = OnceCell::const_new();

pub async fn init () -> Result<(), Error> {
	BOT.get_or_try_init(|| async {
		let cards: Vec<Card> = ygopro3_game::get::cards().await?;
		windbot_rs::load_cards(&cards)?;
		Ok::<WindBot, Error>(WindBot::new())
	}).await?;
	Ok(())
}

pub async fn start (args: String, _i18n: String, deck: String) -> Result<(), Error> {
	init().await?;
	let bot: &WindBot = BOT.get().ok_or(anyhow!("get bot error"))?;
	let mut options: Map<String, Value> = Map::new();
	for argument in args.split_whitespace() {
		let (key, value): (&str, &str) = argument.split_once('=')
			.ok_or_else(|| anyhow!("Invalid WindBot argument: {}", argument))?;
		let value: Value = match key {
			"Port" | "Version" | "Hand" => Value::from(value.parse::<i32>()?),
			"Debug" | "Chat" => Value::Bool(value.to_ascii_lowercase().parse::<bool>()?),
			"Name" | "Deck" | "DeckFile" | "Dialog" | "Host" | "HostInfo" => Value::String(value.to_owned()),
			_ => return Err(anyhow!("Unknown WindBot option: {}", key))
		};
		options.insert(key.to_owned(), value);
	}
	if !deck.is_empty() {
		let path: &PathBuf = RESOURCE_PATH.get().ok_or(anyhow!("get path error"))?;
		let deck_path: PathBuf = path
			.join("deck")
			.join(deck);
		let deck_path: String = deck_path.to_string_lossy().into_owned();
		let deck_path: &str = deck_path.strip_prefix(r"\\?\").unwrap_or(&deck_path);
		options.insert(String::from("DeckFile"), Value::String(deck_path.to_owned()));
	}
	bot.start_bot(to_string(&options)?);
	Ok(())
}

pub async fn stop () -> Result<(), Error> {
	let bot: &WindBot = BOT.get().ok_or(anyhow!("get bot error"))?;
	bot.shutdown()
}

pub async fn list () -> Result<Vec<[String; 3]>, Error> {
	init().await?;
	let bot: &WindBot = BOT.get().ok_or(anyhow!("get bot error"))?;
	let list: String = bot.get_list()?;
	let list: Vec<[String; 5]> = from_str(&list)?;
	Ok(list.into_iter().map(|row: [String; 5]| -> [String; 3] {
		let [name, ai, _, dialog, _]: [String; 5] = row;
		[name, ai, dialog]
	}).collect())
}