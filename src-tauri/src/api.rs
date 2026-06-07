
use crate::game::{self, Game};
use crate::{deck::Deck, log, ypk::Ypk};
use crate::request::{Request as NetWork, Srv};
use crate::ygoserver::YgoServer;
use crate::yrp::Yrp;
#[cfg(not(target_arch = "x86"))]
use crate::windbot::WindBot;

use bincode::{encode_to_vec, decode_from_slice, config::{standard, Configuration}};
use tauri::{
	AppHandle, ipc::{Response, Request, InvokeBody::Raw}
};

static CONFIG : Configuration = standard();

fn default_response () -> Response {
	Response::new(encode_to_vec(Vec::<u8>::new(), CONFIG).unwrap())
}

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
	Ypk::get().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
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
	NetWork::srv(url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pic (deck: Vec<u32>) -> Response {
	Game::get_pic(deck).await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_font () -> Response {
	Game::get_font().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_sound () -> Response {
	Game::get_sound().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_textures () -> Response {
	Game::get_textures().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_cards () -> Response {
	Game::get_cards().await
		.ok()
		.and_then(|cards| encode_to_vec(cards, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_system () -> Response {
	Game::get_system().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_hash () -> Response {
	Game::get_hash().await
		.ok()
		.map(Response::new)
		.unwrap_or(Response::new(Vec::new()))
}

#[tauri::command]
pub async fn get_server () -> Response {
	Game::get_server().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_lflist () -> Response {
	Game::get_lflist().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_strings () -> Response {
	Game::get_strings().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_info () -> Response {
	Game::get_info().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_model () -> Response {
	Game::get_model().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
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
		.unwrap_or_else(default_response)
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

#[tauri::command]
pub async fn ygoserver_start (args: String) -> Result<(), String> {
	let (i18n, pack) = Game::get_server_args()
		.await
		.map_err(|e| e.to_string())?;
	YgoServer::start(args, i18n, pack)
		.await
		.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ygoserver_stop () -> Result<(), String> {
	YgoServer::stop().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn windbot_start (args: String, deck: String) -> Result<(), String> {
	#[cfg(not(target_arch = "x86"))]
	if args.is_empty() {
		WindBot::init().await
	} else {
		let (i18n, _) = Game::get_server_args()
			.await
			.map_err(|e| e.to_string())?;
		WindBot::start(args, i18n, deck).await
	}
		.map_err(|e| e.to_string())?;
	#[cfg(target_arch = "x86")]
	let _ = args;
	Ok(())
}

#[tauri::command]
pub async fn windbot_stop () -> Result<(), String> {
	#[cfg(not(target_arch = "x86"))]
	WindBot::stop().await.map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn windbot_list () -> Response {
	#[cfg(not(target_arch = "x86"))]
	return WindBot::list().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response);
	#[cfg(target_arch = "x86")]
	default_response()
}

#[tauri::command]
pub async fn replay_read (name: String) -> Response {
	Yrp::read(name).await
		.ok()
		.map(Response::new)
		.unwrap_or(Response::new(Vec::new()))
}

#[tauri::command]
pub async fn replay_save (request: Request<'_>) -> Result<String, String> {
	let Raw(bytes) = request.body() else {
		return Err("expected raw body".into());
	};
	let (name, _) = decode_from_slice::<String, Configuration>(&bytes[0..256], CONFIG)
		.map_err(|e| e.to_string())?;
	let content: &[u8] = &bytes[256..];
	Yrp::save(name, content).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn replay_list () -> Response {
	Yrp::get().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn replay_rename (from: String, to: String) -> Result<(), String>{
	Yrp::rename(from, to).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn replay_del (name: String) -> Result<(), String>{
	Yrp::del(name).await.map_err(|e| e.to_string())
}