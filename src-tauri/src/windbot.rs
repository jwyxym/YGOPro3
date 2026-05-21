use crate::PATH;

use libloading::{Library, Symbol};
use anyhow::{Error, Result, anyhow};
use tokio::sync::{OnceCell, RwLock, RwLockReadGuard, RwLockWriteGuard};
use serde_json::from_str;
use std::{
	os::raw::c_char,
	sync::{Arc, Mutex},
	path::{Path, PathBuf},
	ffi::{CString, CStr},
	thread::{self, JoinHandle}
};

static BOT: OnceCell<RwLock<Option<WindBot>>> = OnceCell::const_new();

#[derive(Debug)]
pub struct WindBot {
	lib: Arc<Library>,
	thread: Mutex<Option<JoinHandle<()>>>,
}

impl WindBot {
	pub async fn init () -> Result<(), Error> {
		if BOT.get().is_none() {
			let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
			BOT.set(RwLock::new(Some(Self::new(path)?)))?;
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

	pub async fn start (args: String, i18n: String) -> Result<(), Error> {
		Self::init().await?;
		let bot: &RwLock<Option<Self>> = BOT.get().ok_or(anyhow!("get bot error"))?;
		let bot: RwLockReadGuard<'_, Option<Self>> = bot.read().await;
		let bot: &Self = bot.as_ref().ok_or(anyhow!("get bot error"))?;
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let path: PathBuf = path
			.join("cdb")
			.join(format!("cards-{}.cdb", i18n));
		let path: String = path.to_string_lossy().into_owned();
		let path: &str = path.strip_prefix(r"\\?\").unwrap_or(&path);
		let args: String = format!("DbPath={} {}", path, args);
		bot.start_bot(args);
		Ok(())
	}

	pub async fn stop () -> Result<(), Error> {
		let lock: &RwLock<Option<Self>> = BOT.get().ok_or(anyhow!("get bot error"))?;
		let mut guard: RwLockWriteGuard<'_, Option<Self>> = lock.write().await;

		if let Some(old) = guard.take() {
			drop(guard);
			old.shutdown()?;
			guard = lock.write().await;
			let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
			*guard = Some(Self::new(path)?);
		}
		Ok(())
	}

	pub async fn list () -> Result<Vec<[String; 3]>, Error> {
		Self::init().await?;
		let bot: &RwLock<Option<Self>> = BOT.get().ok_or(anyhow!("get bot error"))?;
		let bot: RwLockReadGuard<'_, Option<Self>> = bot.read().await;
		let bot: &Self = bot.as_ref().ok_or(anyhow!("get bot error"))?;
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

	fn shutdown (self) -> Result<(), Error> {
		let Self { lib, thread } = self;

		if let Ok(mut lock) = thread.lock() {
			if let Some(handle) = lock.take() {
				let _ = handle.join();
			}
		}
		
		Arc::try_unwrap(lib)
			.map(|library| drop(library))
			.map_err(|_| anyhow!("dll shutdown error"))?;

		Ok(())
	}
}
