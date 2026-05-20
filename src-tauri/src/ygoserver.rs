use crate::PATH;

use libloading::{Library, Symbol};
use anyhow::{Error, Result, anyhow};
use tokio::sync::{OnceCell, RwLock, RwLockReadGuard, RwLockWriteGuard};
use std::{
	os::raw::c_char,
	sync::{Arc, Mutex},
	path::{Path, PathBuf},
	ffi::CString,
	thread::{self, JoinHandle}
};

static SERVER: OnceCell<RwLock<Option<YgoServer>>> = OnceCell::const_new();

#[derive(Debug)]
pub struct YgoServer {
	lib: Arc<Library>,
	thread: Mutex<Option<JoinHandle<()>>>,
}

impl YgoServer {
	pub async fn init<P: AsRef<Path>>(path: P) -> Result<(), Error> {
		if SERVER.get().is_none() {
			SERVER.set(RwLock::new(Some(Self::new(path)?)))?;
		}
		Ok(())
	}
	pub fn new<P: AsRef<Path>> (path: P) -> Result<Self, Error> {
		let path: &Path = path.as_ref();

		unsafe {
			#[cfg(target_os = "windows")]
			let lib: Library = Library::new(path.join("ygoserver.dll"))?;

			#[cfg(target_os = "linux")]
			let lib = Library::new(path.join("libygoserver.so"))?;

			#[cfg(target_os = "macos")]
			let lib = Library::new(path.join("libygoserver.dylib"))?;
			
			#[cfg(target_os = "android")]
			let lib = {
				let _ = path;
				Library::new("libygoserver.so")
			}?;

			Ok(Self {
				lib: Arc::new(lib),
				thread: Mutex::new(None)
			})
		}
	}

	pub async fn start (args: String, i18n: String, pack: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		Self::init(&path).await?;
		let server: &RwLock<Option<Self>> = SERVER.get().ok_or(anyhow!("get server error"))?;
		let server: RwLockReadGuard<'_, Option<Self>> = server.read().await;
		let server: &Self = server.as_ref().ok_or(anyhow!("get server error"))?;
		let path: String = path.to_string_lossy().into_owned();
		let path: &str = path.strip_prefix(r"\\?\").unwrap_or(&path);
		let path: String = path.replace("\\", "/");
		let args: String = format!("{} \"{}\" {} {}", args, path, i18n, pack);
		server.start_server(args);
		Ok(())
	}

	pub async fn stop () -> Result<(), Error> {
		let lock: &RwLock<Option<Self>> = SERVER.get().ok_or(anyhow!("get server error"))?;
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

	fn start_server (&self, args: String) {
		let lib: Arc<Library> = self.lib.clone();

		let handle: JoinHandle<()> = thread::spawn(move || {
			unsafe {
				if let Ok(start) = lib.get::<Symbol<unsafe extern "C" fn(*const c_char) -> i32>>(b"start_server") {
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
		unsafe {
			if let Ok(stop) = lib.get::<unsafe extern "C" fn()>(b"stop_server") {
				stop();
			}
		}

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
