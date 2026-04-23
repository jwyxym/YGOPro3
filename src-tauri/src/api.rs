
use crate::game::{self, Game, Srv};
use crate::{deck::Deck, log, ypk::Ypk};

use bincode::{encode_to_vec, config::{standard, Configuration}};
use tauri::{
	AppHandle, ipc::Response
};

static CONFIG : Configuration = standard();

#[tauri::command]
pub async fn init (app: AppHandle) -> Result<(), String> {
	game::init(&app).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reload (app: AppHandle, overwrite: bool) -> Result<(), String> {
	game::reload(&app, overwrite).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download (app: AppHandle, url: String, name: String) -> Result<String, String> {
	Game::download(&app, url, name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ypk () -> Response {
	Game::get_zip().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn load_ypk (app: AppHandle, name: String) -> Result<(), String> {
	Game::load_zip(&app, name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unload_ypk (name: String) -> Result<(), String> {
	Game::unload_zip(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_system (key: String, ct: i8, value: String, write: bool) -> Result<(), String> {
	Game::set_system(key, ct, value, write).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn chk_version () -> Result<bool, String> {
	Game::chk_version().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_srv (url: String) -> Result<Srv, String> {
	game::Request::srv(url).map_err(|e| e.to_string())
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
pub async fn get_time (path: Vec<String>) -> Result<String, String> {
	Game::get_time(path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_deck (name: String, deck: String) -> Result<(), String> {
	Deck::write(name, deck).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_deck (old_name: String, new_name: String) -> Result<(), String> {
	Deck::rename(old_name, new_name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn del_deck (name: String) -> Result<(), String> {
	Deck::del(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_deck () -> Response {
	Deck::get().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn write_log (line: String) -> Result<(), String> {
	log::write(line).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn del_ypk (name: String) -> Result<(), String> {
	Ypk::del(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn exists_ypk (name: String) -> Result<bool, String> {
	Ypk::exists(name).await.map_err(|e| e.to_string())
}