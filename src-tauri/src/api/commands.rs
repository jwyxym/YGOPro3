use crate::game::{self, Game};

use bincode::{encode_to_vec, config::{standard, Configuration}};
use lazy_static::lazy_static;
use tauri::{
	ipc::Response
};

lazy_static! {
	pub static ref CONFIG : Configuration = standard();
}

#[tauri::command]
pub async fn init (path: String) -> Result<(), String> {
	game::init(path).await.map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn unzip (path: String) -> Result<(), String> {
	Ok(Game::unzip(path, true).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn get_pic () -> Response {
	Game::get_pic().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_font () -> Response {
	Game::get_font().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_sound () -> Response {
	Game::get_sound().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_textures () -> Response {
	Game::get_textures().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_cards () -> Response {
	Game::get_cards().await
		.ok()
		.and_then(|cards| encode_to_vec(cards, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_system () -> Response {
	Game::get_system().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_server () -> Response {
	Game::get_server().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_lflist () -> Response {
	Game::get_lflist().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_strings () -> Response {
	Game::get_strings().await
		.ok()
		.and_then(|i| encode_to_vec(i, *CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(|| Response::new(Vec::new()))
}