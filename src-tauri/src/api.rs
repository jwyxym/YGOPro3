
use crate::game::{self, Game, Srv};

use bincode::{encode_to_vec, config::{standard, Configuration}};
use tauri::{
	AppHandle, ipc::Response
};

static CONFIG : Configuration = standard();

#[tauri::command]
pub async fn init (app: AppHandle) -> Result<(), String> {
	game::init(&app).await.map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn reload (app: AppHandle, overwrite: bool) -> Result<(), String> {
	game::reload(&app, overwrite).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_assets (app: AppHandle) -> Result<(), String> {
	game::download(&app).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download (app: AppHandle, url: String, name: String) -> Result<String, String> {
	Game::download(&app, url, name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update (app: AppHandle) -> Result<(), String> {
	Game::update(&app).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_ypk (app: AppHandle, name: String) -> Result<(), String> {
	Game::load_zip(&app, name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_system (key: String, ct: i8, value: String) -> Result<(), String> {
	Game::set_system(key, ct, value).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn chk_version () -> Result<bool, String> {
	Game::chk_version().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_srv (url: String) -> Result<Srv, String> {
	Game::get_srv(url).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pic (deck: Vec<u32>) -> Response {
	Game::get_pic(deck).await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_font () -> Response {
	Game::get_font().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_sound () -> Response {
	Game::get_sound().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_textures () -> Response {
	Game::get_textures().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_cards () -> Response {
	Game::get_cards().await
		.ok()
		.and_then(|cards| encode_to_vec(cards, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_system () -> Response {
	Game::get_system().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_server () -> Response {
	Game::get_server().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_lflist () -> Response {
	Game::get_lflist().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_strings () -> Response {
	Game::get_strings().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_info () -> Response {
	Game::get_info().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_model () -> Response {
	Game::get_model().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_deck () -> Response {
	Game::get_deck().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}
#[tauri::command]
pub async fn get_time (path: Vec<String>) -> Result<String, String> {
	Game::get_time(path).await.map_err(|e| e.to_string())
}