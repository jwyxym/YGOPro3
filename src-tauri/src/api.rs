mod commands;

use std::{sync::OnceLock, path::PathBuf};
use tauri_plugin_os::{OsType, type_};
use tauri::{
	Builder,
	Runtime,
	generate_handler,
	path::BaseDirectory,
	Manager
};

static PATH: OnceLock<PathBuf> = OnceLock::new();

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
		commands::get_info,
		commands::get_model,
		commands::get_deck,
	])
	.setup(|app| {
		let path: PathBuf = app.path().resolve("./", {
			match type_() {
				OsType::Android => BaseDirectory::Public,
				_ => BaseDirectory::Resource
			}
		})?;
		let _ = PATH.set(path);
		Ok(())
	})
}