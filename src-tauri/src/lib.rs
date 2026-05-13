mod api;
mod game;
mod deck;
mod log;
mod ypk;
mod file;
mod request;
mod ygoserver;

use game::{PATH, RESOURCE_PATH};
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
			api::get_ypk,
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
			api::write_deck,
			api::rename_deck,
			api::del_deck,
			api::write_log,
			api::del_ypk,
			api::exists_ypk,
			api::ygoserver_start,
			api::ygoserver_stop,
		])
		.setup(|app| {
			#[cfg(target_os = "android")]
			{
				let path = app.path().resolve("./", BaseDirectory::Public)?;
				if let Some(parent) = path.parent() {
					let path = parent.to_path_buf();
					log::init(&path)?;
					RESOURCE_PATH.set(path.clone()).ok();
					PATH.set(path).ok();
				}
				ygoserver::init(path)?;
			}
			#[cfg(not(target_os = "android"))]
			{
				let path = app.path().resolve("./", BaseDirectory::Resource)?;
				RESOURCE_PATH.set(path.clone()).ok();

				let path = if log::init(&path).is_err() {
					let path = app.path().resolve("./", BaseDirectory::AppLocalData)?;
					log::init(&path)?;
					PATH.set(path.clone()).ok();
					path
				} else {
					PATH.set(path.clone()).ok();
					path
				};
				ygoserver::init(path)?;
			}
			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
