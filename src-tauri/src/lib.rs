mod api;
mod game;

use game::PATH;
use std::path::PathBuf;
use tauri_plugin_os::{OsType, type_};
use tauri::{
	Builder,
	generate_handler,
	path::BaseDirectory,
	Manager
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	Builder::default()
		.plugin(tauri_plugin_http::init())
		.plugin(tauri_plugin_tcp::init())
		.plugin(tauri_plugin_websocket::init())
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_process::init())
		.plugin(tauri_plugin_os::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_opener::init())
		.invoke_handler(generate_handler![
			api::init,
			api::reload,
			api::download,
			api::download_assets,
			api::load_ypk,
			api::unload_ypk,
			api::chk_version,
			api::get_srv,
			api::get_pic,
			api::get_font,
			api::get_sound,
			api::get_textures,
			api::get_cards,
			api::get_system,
			api::get_server,
			api::get_strings,
			api::get_lflist,
			api::get_info,
			api::get_model,
			api::get_deck,
			api::get_time,
			api::set_system,
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
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}