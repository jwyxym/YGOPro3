mod zip;
mod read;
mod network;
use read::{FileContent, Pic};
use network::{Srv, Resp};

mod api;
mod game;

use tauri::{
	Builder,
	AppHandle
};

#[tauri::command]
async fn read_time(time : String) -> Result<String, String> {
	Ok(read::time(time).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn network_srv(url: String) -> Result<Srv, String> {
	Ok(network::srv(url).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn network_version(url: String, headers: Vec<(String, String)>) -> Result<String, String> {
	Ok(network::version(url, headers).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn network_time(urls: Vec<String>) -> Result<Vec<Resp>, String> {
	Ok(network::time(urls).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn network_download(app: AppHandle, url: String, path: String, name: String, ex_name: String,) -> Result<String, String> {
	Ok(network::download(app, url, path, name, ex_name).await.map_err(|e| e.to_string())?)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	api::init(Builder::default()
		.plugin(tauri_plugin_http::init())
		.plugin(tauri_plugin_tcp::init())
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_process::init())
		.plugin(tauri_plugin_os::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_opener::init()))
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}