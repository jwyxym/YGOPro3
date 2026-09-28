use anyhow::{Error, Result};

pub async fn start (
	lflist: u32,
	rule: u8,
	mode: u8,
	replay_mode: u32,
	duel_rule: bool,
	no_check_deck: bool,
	no_shuffle_deck: bool,
	start_lp: u32,
	start_hand: u8,
	draw_count: u8,
	time_limit: u16,
) -> Result<u16, Error> {
	let (
		data_manager,
		deck_manager,
		config_manager,
		script_reader,
		card_reader,
		message_handler
	) = super::init::init().await?;
	let port: u16 = ygopro_server::start(
		lflist,
		rule,
		mode,
		replay_mode,
		duel_rule,
		no_check_deck,
		no_shuffle_deck,
		start_lp,
		start_hand,
		draw_count,
		time_limit,
		data_manager,
		deck_manager,
		config_manager,
		script_reader,
		card_reader,
		message_handler
	)?;
	Ok(port)
}

pub fn stop () {
	ygopro_server::stop();
}