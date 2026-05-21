use crate::PATH;

use libloading::{Library, Symbol};
use anyhow::{Error, Result, anyhow};
use tokio::sync::OnceCell;
use serde_json::from_str;
use std::{
	os::raw::c_char,
	sync::{Arc, Mutex},
	path::{Path, PathBuf},
	ffi::{CString, CStr},
	thread::{self, JoinHandle}
};

static BOT: OnceCell<WindBot> = OnceCell::const_new();

#[derive(Debug)]
pub struct WindBot {
	lib: Arc<Library>,
	thread: Mutex<Option<JoinHandle<()>>>,
}

impl WindBot {
	pub async fn init () -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		if BOT.get().is_none() {
			BOT.set(Self::new(path)?)?;
		}
		Ok(())
	}
	pub fn new<P: AsRef<Path>> (path: P) -> Result<Self, Error> {
		let path: &Path = path.as_ref();

		unsafe {
			#[cfg(target_os = "windows")]
			let lib: Library = Library::new(path.join("WindBot.dll"))?;

			#[cfg(target_os = "linux")]
			let lib = Library::new(path.join("WindBot.so"))?;

			#[cfg(target_os = "macos")]
			let lib = Library::new(path.join("WindBot.dylib"))?;
			
			#[cfg(target_os = "android")]
			let lib = {
				let _ = path;
				Library::new("WindBot.so")
			}?;

			Ok(Self {
				lib: Arc::new(lib),
				thread: Mutex::new(None)
			})
		}
	}

	pub async fn start (args: String, i18n: String, deck: String) -> Result<(), Error> {
		Self::init().await?;
		let bot: &Self = BOT.get().ok_or(anyhow!("get bot error"))?;
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let db_path: PathBuf = path
			.join("cdb")
			.join(format!("cards-{}.cdb", i18n));
		let db_path: String = db_path.to_string_lossy().into_owned();
		let db_path: &str = db_path.strip_prefix(r"\\?\").unwrap_or(&db_path);
		let args: String = if deck.is_empty() {
			format!("DbPath={} {}", db_path, args)
		} else {
			let deck_path: PathBuf = path
				.join("deck")
				.join(deck);
			let deck_path: String = deck_path.to_string_lossy().into_owned();
			let deck_path: &str = deck_path.strip_prefix(r"\\?\").unwrap_or(&deck_path);
			format!("DbPath={} {} DeckFile={}", db_path, args, deck_path)
		};
		bot.start_bot(args);
		Ok(())
	}

	pub async fn stop () -> Result<(), Error> {
		let bot: &Self = BOT.get().ok_or(anyhow!("get bot error"))?;
		bot.shutdown()
	}

	pub async fn list () -> Result<Vec<[String; 3]>, Error> {
		Self::init().await?;
		let bot: &Self = BOT.get().ok_or(anyhow!("get bot error"))?;
		let list: String = bot.get_list();
		let list: Vec<[String; 3]> = from_str(&list)?;
		Ok(list)
	}

	fn get_list(&self) -> String {
		|| -> Result<String, Error> {
			unsafe {
				let windbot_list: Symbol<unsafe extern "C" fn() -> *const c_char> = self.lib.get(b"windbot_list")?;
				let windbot_free: Symbol<unsafe extern "C" fn(*const c_char)> = self.lib.get(b"windbot_free")?;

				let ptr: *const i8 = windbot_list();

				if !ptr.is_null() {
					let s: &CStr = CStr::from_ptr(ptr);
					let str: String = String::from(s.to_string_lossy());

					windbot_free(ptr);
					return Ok(str);
				}
				Ok(String::from(""))
			}
		}()
			.unwrap_or(String::from(""))
	}

	fn start_bot (&self, args: String) {
		let lib: Arc<Library> = self.lib.clone();

		let handle: JoinHandle<()> = thread::spawn(move || {
			unsafe {
				if let Ok(start) = lib.get::<Symbol<unsafe extern "C" fn(*const c_char) -> i32>>(b"windbot_start") {
					if let Ok(c_args) = CString::new(args) {
						start(c_args.as_ptr());
					}
				}
			}
		});

		if let Ok(mut lock) = self.thread.lock() {
			*lock = Some(handle);
		}
	}

	fn shutdown (&self) -> Result<(), Error> {
		if let Ok(mut lock) = self.thread.lock() {
			if let Some(handle) = lock.take() {
				let _ = handle.join();
			}
		}

		Ok(())
	}
}
