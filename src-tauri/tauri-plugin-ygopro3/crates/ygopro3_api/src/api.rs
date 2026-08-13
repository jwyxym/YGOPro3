use ygopro3_const::*;
use ygopro3_game::{game::{self, Game}, GAME};
use ygopro3_log::log;
use ygopro3_network::{Srv, srv};
use ygopro3_deck::deck;
use ygopro3_ypk::ypk;
use ygopro3_yrp::yrp;

use bincode::{encode_to_vec, decode_from_slice, config::{standard, Configuration}};
use serde_json::Value::Array;
use std::{borrow::Cow, fs::metadata};
use tauri::{
	AppHandle, ipc::{Response, Request, InvokeBody::{Raw, Json}}
};
use parking_lot::{RwLock, RwLockReadGuard};
use std::{path::PathBuf, fs::exists};
use chrono::{DateTime, Utc};

static CONFIG : Configuration = standard();

fn default_response () -> Response {
	Response::new(encode_to_vec(Vec::<u8>::new(), CONFIG).unwrap())
}

#[tauri::command]
pub async fn init (app: AppHandle) -> Result<(), String> {
	ygopro3_game::init(&app).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reload (app: AppHandle, overwrite: bool) -> Result<(), String> {
	ygopro3_game::reload(&app, overwrite).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download (app: AppHandle, url: String, name: String, chunk: usize) -> Result<String, String> {
	let path: &PathBuf = PATH.get().ok_or(String::from("get path error"))?;
	let (_, max_retries) = ygopro3_game::get::system()
		.await
		.map_err(|e| e.to_string())?
		.2
		.into_iter()
		.find(|i|
			i.0 == "CT_DOWNLOADCHUNKS_RETRIES"
		)
		.unwrap_or((String::new(), 8.0));
	ygopro3_network::download(&app, path.join("expansions"), &url, &name, chunk, max_retries)
		.await
		.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ypk () -> Response {
	ypk::get().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn load_ypk (app: AppHandle, name: String) -> Result<(), String> {
	game::load::zip(&app, name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unload_ypk (name: String) -> Result<(), String> {
	game::unload::zip(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_system (key: String, ct: i8, value: String, write: bool) -> Result<(), String> {
	ygopro3_game::set::system(key, ct, value, write).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn chk_version () -> Result<bool, String> {
	let game: &RwLock<Game> = GAME.get().ok_or(String::new())?;
	let game: RwLockReadGuard<'_, Game> = game.read();
	Ok(ygopro3_network::chk_version(URL_GAME_VERSION, &game.version).await)
}

#[tauri::command]
pub fn get_srv (url: String) -> Result<Srv, String> {
	srv(url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pic (request: Request<'_>) -> Result<Response, String> {
	let bytes: Cow<'_, Vec<u8>> = match request.body() {
		Raw(data) => Cow::Borrowed(data),
		Json(Array(data)) => Cow::Owned(
			data.iter()
				.flat_map(|v| v.as_number().and_then(|v| v.as_u64().map(|v| v as u8)))
				.collect(),
		),
		_ => return Err(String::from("unexpected invoke body")),
	};
	let (deck, _) = decode_from_slice::<Vec<u32>, Configuration>(&bytes, CONFIG)
		.map_err(|e| e.to_string())?;
	Ok(ygopro3_game::get::pic(deck).await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response))
}

#[tauri::command]
pub async fn get_sound () -> Response {
	ygopro3_game::get::sound().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_textures () -> Response {
	ygopro3_game::get::textures().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_cards () -> Response {
	ygopro3_game::get::cards().await
		.ok()
		.and_then(|cards| encode_to_vec(cards, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_system () -> Response {
	ygopro3_game::get::system().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_server () -> Response {
	ygopro3_game::get::server().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_lflist () -> Response {
	ygopro3_game::get::lflist().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_strings () -> Response {
	ygopro3_game::get::strings().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_info () -> Response {
	ygopro3_game::get::info().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_room () -> Response {
	ygopro3_game::get::room().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn get_time (path: Vec<String>) -> Result<String, String> {
	let p: Vec<String> = path;
	let path: &PathBuf = PATH.get().ok_or(String::from("get path error"))?;
	let mut path: PathBuf = path.clone();
	for i in p {
		path = path.join(&i);
	}
	if exists(&path).map_err(|e| e.to_string())? {
		let time: DateTime<Utc> = metadata(path)
			.map_err(|e| e.to_string())?
			.modified()
			.map_err(|e| e.to_string())?
			.into();
		Ok(time.to_rfc3339())
	} else {
		Ok(String::new())
	}
}

#[tauri::command]
pub async fn get_version (app: AppHandle) -> String {
	app.package_info().version.to_string()
}

#[tauri::command]
pub async fn write_deck (name: String, deck: String) -> Result<(), String> {
	deck::write(name, deck).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rename_deck (old_name: String, new_name: String) -> Result<(), String> {
	deck::rename(old_name, new_name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn del_deck (name: String) -> Result<(), String> {
	deck::del(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_deck () -> Response {
	deck::get().await
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
	ypk::del(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn exists_ypk (name: String) -> Result<bool, String> {
	ypk::exists(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ygoserver_start (
	lflist: u32, //lflist hash
	rule: u8,
	mode: u8,
	replay_mode: u32,
	duel_rule: bool,
	no_check_deck: bool,
	no_shuffle_deck: bool,
	start_lp: u32,
	start_hand: u8,
	draw_count: u8,
	time_limit: u16
) -> Result<u16, String> {
	ygopro3_single_duel::start_server(
		lflist,
		rule,
		mode,
		replay_mode,
		duel_rule,
		no_check_deck,
		no_shuffle_deck,
		start_lp,
		start_hand,
		draw_count,
		time_limit
	).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ygoserver_stop () -> Result<(), String> {
	Ok(ygopro3_single_duel::stop_server())
}

#[tauri::command]
pub async fn windbot_start (args: String, deck: String) -> Result<(), String> {
	#[cfg(not(target_arch = "x86"))]
	if args.is_empty() {
		ygopro3_windbot::init().await
	} else {
		let (i18n, _) = ygopro3_game::get::server_args()
			.await
			.map_err(|e| e.to_string())?;
		ygopro3_windbot::start(args, i18n, deck).await
	}
		.map_err(|e| e.to_string())?;
	#[cfg(target_arch = "x86")]
	let _ = args;
	Ok(())
}

#[tauri::command]
pub async fn windbot_stop () -> Result<(), String> {
	#[cfg(not(target_arch = "x86"))]
	ygopro3_windbot::stop().await.map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn windbot_list () -> Response {
	#[cfg(not(target_arch = "x86"))]
	return ygopro3_windbot::list().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response);
	#[cfg(target_arch = "x86")]
	default_response()
}

#[tauri::command]
pub async fn replay_read (name: String) -> Response {
	yrp::read(name).await
		.ok()
		.map(Response::new)
		.unwrap_or(Response::new(Vec::new()))
}

#[tauri::command]
pub async fn replay_save (request: Request<'_>) -> Result<String, String> {
	let bytes: Cow<'_, Vec<u8>> = match request.body() {
		Raw(data) => Cow::Borrowed(data),
		Json(Array(data)) => Cow::Owned(
			data.iter()
				.flat_map(|v| v.as_number().and_then(|v| v.as_u64().map(|v| v as u8)))
				.collect(),
		),
		_ => return Err(String::from("unexpected invoke body")),
	};
	let (name, _) = decode_from_slice::<String, Configuration>(&bytes[0..256], CONFIG)
		.map_err(|e| e.to_string())?;
	let content: &[u8] = &bytes[256..];
	yrp::save(name, content).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn replay_list () -> Response {
	yrp::get().await
		.ok()
		.and_then(|i| encode_to_vec(i, CONFIG).ok())
		.map(Response::new)
		.unwrap_or_else(default_response)
}

#[tauri::command]
pub async fn replay_rename (from: String, to: String) -> Result<(), String>{
	yrp::rename(from, to).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn replay_del (name: String) -> Result<(), String>{
	yrp::del(name).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_hash () -> Result<Response, String> {
	Ok(Response::new(ygopro3_game::get::hash().await.map_err(|e| e.to_string())?))
}