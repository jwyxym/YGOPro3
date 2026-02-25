mod commands;

use tauri::{
	Builder,
	Runtime,
	generate_handler
};

pub fn init<R: Runtime> (build: Builder<R>) -> Builder<R> {
	build.invoke_handler(generate_handler![
		commands::init,
		commands::unzip,
		commands::get_pic,
		commands::get_font,
		commands::get_sound,
		commands::get_textures,
		commands::get_cards,
		commands::get_system,
		commands::get_server,
		commands::get_strings,
		commands::get_lflist,
	])
}