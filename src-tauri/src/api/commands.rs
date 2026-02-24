use crate::game::{self, Game};

use bincode::{encode_to_vec, config::{standard, Configuration}};
use lazy_static::lazy_static;
use tauri::{
	AppHandle,
	ipc::Response
};

lazy_static! {
	pub static ref CONFIG : Configuration = standard();
}

#[tauri::command]
pub async fn init(path: String) -> Result<(), String> {
	game::init(path).await.map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn unzip(path: String) -> Result<(), String> {
	Ok(Game::unzip(path, true).await.map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn get_pic() -> Response {
	if let Ok(i) = Game::get_pic().await {
		Response::new(
			encode_to_vec(i, *CONFIG)
				.unwrap_or(Vec::new())
		)
	} else {
		Response::new(Vec::new())
	}
}

#[tauri::command]
pub async fn get_font() -> Response {
	if let Ok(i) = Game::get_font().await {
		Response::new(
			encode_to_vec(i, *CONFIG)
				.unwrap_or(Vec::new())
		)
	} else {
		Response::new(Vec::new())
	}
}

#[tauri::command]
pub async fn get_sound() -> Response {
	if let Ok(i) = Game::get_sound().await {
		Response::new(
			encode_to_vec(i, *CONFIG)
				.unwrap_or(Vec::new())
		)
	} else {
		Response::new(Vec::new())
	}
}

#[tauri::command]
pub async fn get_textures() -> Response {
	if let Ok(i) = Game::get_textures().await {
		Response::new(
			encode_to_vec(i, *CONFIG)
				.unwrap_or(Vec::new())
		)
	} else {
		Response::new(Vec::new())
	}
}