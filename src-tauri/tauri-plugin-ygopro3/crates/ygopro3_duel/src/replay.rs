use anyhow::{Error, Result};
pub async fn collect_messages (yrp: Vec<u8>) -> Result<Vec<u8>, Error> {
	let (
		data_manager,
		deck_manager,
		config_manager,
		script_reader,
		card_reader,
		message_handler
	) = super::init::init().await?;
	ygopro_yrp_decoding::collect_messages(
		yrp,
		data_manager,
		deck_manager,
		config_manager,
		script_reader,
		card_reader,
		message_handler
	).await
}