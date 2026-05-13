use libloading::{Library, Symbol};
use std::{
	sync::{Arc, Mutex},
	path::Path,
	thread::{self, JoinHandle}
};
use tokio::sync::OnceCell;
use anyhow::{Error, Result, anyhow};


pub static SERVER: OnceCell<YgoServer> = OnceCell::const_new();

pub struct YgoServer {
	lib: Arc<Library>,
	thread: Mutex<Option<JoinHandle<()>>>,
}

impl YgoServer {
	pub fn init<P: AsRef<Path>> (path: P) -> Result<(), Error> {
		if !SERVER.get().is_some() {
			SERVER.set(Self::new(path)?).ok();
		}
		Ok(())
	}
	pub fn new<P: AsRef<Path>> (path: P) -> Result<Self, Error> {
		let path: &Path = path.as_ref();
		unsafe {
			#[cfg(target_os = "windows")]
			let lib = Library::new(path.join("ygoserver.dll"))?;

			#[cfg(target_os = "linux")]
			let lib = Library::new(path.join("libygoserver.so"))?;

			#[cfg(target_os = "macos")]
			let lib = Library::new(path.join("libygoserver.dylib"))?;

			Ok(Self {
				lib: Arc::new(lib),
				thread: Mutex::new(None),
			})
		}
	}

	pub fn start (args: String) -> Result<(), Error> {
		let server: &YgoServer = SERVER.get().ok_or(anyhow!("get server error"))?;
		server.start_server(args);
		Ok(())
	}

	pub fn stop () -> Result<(), Error> {
		let server: &YgoServer = SERVER.get().ok_or(anyhow!("get server error"))?;
		server.stop_server();
		Ok(())
	}

	fn start_server (&self, args: String) {
		let lib = self.lib.clone();

		let handle = thread::spawn(move || {
			unsafe {
				let start: Symbol<unsafe extern "C" fn(*const i8) -> i32> =
					lib.get(b"start_server").unwrap();

				let c_args = std::ffi::CString::new(args).unwrap();
				start(c_args.as_ptr());
			}
		});

		*self.thread.lock().unwrap() = Some(handle);
	}

	fn stop_server (&self) {
		unsafe {
			if let Ok(stop) = self.lib.get::<Symbol<unsafe extern "C" fn()>>(b"stop_server") {
				stop();
			}
		}

		if let Some(handle) = self.thread.lock().unwrap().take() {
			let _ = handle.join();
		}
	}
}