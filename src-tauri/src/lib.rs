use tauri::Builder;

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
		.plugin(tauri_plugin_dglab_ws_server::init())
		.plugin(tauri_plugin_ygopro3::init())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
