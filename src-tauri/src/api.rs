mod commands;

use tauri::{
	Builder,
	AppHandle,
	Runtime
};

pub fn init<R: Runtime> (build: Builder<R>) -> Builder<R> {
	build.invoke_handler(tauri::generate_handler![
		commands::init,
		commands::unzip,
		commands::get_pic,
		commands::get_font,
		commands::get_sound,
		commands::get_textures
	])
}