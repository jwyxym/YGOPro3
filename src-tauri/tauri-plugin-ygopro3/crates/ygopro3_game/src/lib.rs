pub mod game;
pub mod get;
pub mod set;
use game::Game;

use ygopro3_info::*;
use ygopro3_card::*;
use ygopro3_lflist::*;
use ygopro3_picture::*;
use ygopro3_resource::*;
use ygopro3_server_list::*;
use ygopro3_scripts::*;
use ygopro3_sound::*;
use ygopro3_strings::*;
use ygopro3_system::*;
use ygopro3_room::*;
use ygopro3_zip::*;
use ygopro3_ex_code::SetCode;
use ygopro3_fs::*;
use ygopro3_const::*;
use ygopro3_emit::progress::{self, Event};

use anyhow::{Error, Result, anyhow};
use walkdir::{WalkDir, DirEntry};
use indexmap::IndexMap;
use parking_lot::{RwLock, RwLockReadGuard, RwLockWriteGuard};
use tokio::{
	task::{JoinHandle, spawn},
	fs::{create_dir_all, read_to_string},
	sync::OnceCell,
	join
};
use futures::{StreamExt, stream::FuturesUnordered};
use std::{
	collections::BTreeMap,
	fs::{write, read, metadata},
	path::{Path, PathBuf},
	io::Read
};
use tauri::AppHandle;

#[cfg(not(target_os = "android"))]
use std::env;

pub static GAME: OnceCell<RwLock<Game>> = OnceCell::const_new();

pub async fn init (app: &AppHandle) -> Result<(), Error> {
	if !GAME.get().is_some() {
		let game: RwLock<Game> = RwLock::new(Game::init(app, false).await?);
		GAME.set(game)?;
	}
	Ok(())
}
pub async fn reload (app: &AppHandle, overwrite: bool) -> Result<(), Error> {
	let game: &RwLock<Game> = GAME.get().ok_or(anyhow!("get game error"))?;
	progress::emit(app, Event::Start, 5);
	let new_game: Game = Game::init(app, overwrite).await?;
	let mut game: RwLockWriteGuard<'_, Game> = game.write();
	*game = new_game;
	Ok(())
}
