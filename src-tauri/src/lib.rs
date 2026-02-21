mod zip;
mod read;
mod network;
use read::{FileContent, Pic};
use network::{Srv, Resp};

mod game;
use game::Game;

use tauri::AppHandle;

#[tauri::command]
async fn init(app: AppHandle) -> Result<(), String> {
	Ok(())
}

#[tauri::command]
async fn unzip(app: AppHandle, path: String, file: String, chk: bool) -> Result<(), String> {
	Ok(zip::unzip(app, path, file, chk).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn read_texts(
	dirs: Vec<String>,
	file_type: Vec<String>
) -> Result<Vec<(String, FileContent)>, String> {
	Ok(read::texts(dirs, file_type).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn read_files(
	dirs: Vec<String>,
	file_type: Vec<String>
) -> Result<Vec<(String, FileContent)>, String> {
	Ok(read::files(dirs, file_type).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn read_pics(dirs: Vec<String>, codes: Vec<i64>) -> Result<(Vec<Pic>, Vec<i64>), String> {
	Ok(read::pics(dirs, codes).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn read_zip(
	path: String,
	file_type: Vec<String>
) -> Result<Vec<(String, FileContent)>, String> {
	Ok(read::zip(path, file_type).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn read_dbs(dirs: Vec<String>) -> Result<Vec<Vec<(Vec<i64>, Vec<String>)>>, String> {
	Ok(read::databases(dirs).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
async fn read_db(path: String) -> Result<Vec<(Vec<i64>, Vec<String>)>, String> {
	Ok(read::database(path).await.map_err(|e| e.to_string())?)
}

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
	tauri::Builder::default()
		.plugin(tauri_plugin_http::init())
		.plugin(tauri_plugin_tcp::init())
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_process::init())
		.plugin(tauri_plugin_os::init())
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_opener::init())
		.invoke_handler(tauri::generate_handler![
			init,
			unzip,
			read_zip,
			read_texts,
			read_files,
			read_pics,
			read_dbs,
			read_db,
			read_time,
			network_srv,
			network_version,
			network_time,
			network_download,
		])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}