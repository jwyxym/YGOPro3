mod api;
mod game;
mod deck;
mod log;
mod ypk;
mod yrp;
mod file;
mod request;
mod ygoserver;
#[cfg(not(target_arch = "x86"))]
mod windbot;

use std::{
	path::PathBuf,
	sync::OnceLock
};
use tauri::{
	Builder,
	generate_handler,
	path::BaseDirectory,
	Manager
};

pub static RESOURCE_PATH: OnceLock<PathBuf> = OnceLock::new();
pub static PATH: OnceLock<PathBuf> = OnceLock::new();

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
		.plugin(tauri_plugin_dialog::init())
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
			api::get_hash,
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
			api::windbot_start,
			api::windbot_stop,
			api::windbot_list,
			api::replay_read,
			api::replay_save,
			api::replay_list,
			api::replay_rename,
			api::replay_del,
			api::get_related_cards,
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
			}
			#[cfg(not(target_os = "android"))]
			{
				let path = app.path().resolve("./", BaseDirectory::Resource)?;
				RESOURCE_PATH.set(path.clone()).ok();

				let path = if log::init(&path).is_err() {
					let path = app.path().resolve("./", BaseDirectory::AppLocalData)?;
					log::init(&path)?;
					path
				} else {
					path
				};
				PATH.set(path).ok();
			}
			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
