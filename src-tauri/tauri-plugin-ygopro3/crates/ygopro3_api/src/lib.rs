mod api;

use tauri::{
	path::BaseDirectory,
	plugin::{Builder, TauriPlugin},
	Manager,
	Wry,
	generate_handler
};

use ygopro3_const::{PATH, RESOURCE_PATH};
use ygopro3_log::log;

pub fn init () -> TauriPlugin<Wry> {
	#[allow(unused_mut)]
	let mut builder = Builder::new("ygopro3");

	builder
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
			api::get_sound,
			api::get_textures,
			api::get_cards,
			api::get_system,
			api::get_hash,
			api::get_server,
			api::get_strings,
			api::get_lflist,
			api::get_info,
			api::get_room,
			api::get_deck,
			api::get_time,
			api::get_version,
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
			api::extend_load,
			api::extend_unload,
			api::extend_call
		])
		.setup(|app, _api| {
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
		.build()
}
