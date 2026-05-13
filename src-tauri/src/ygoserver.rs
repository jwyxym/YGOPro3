use libloading::{Library, Symbol};
use anyhow::{Error, Result, anyhow};
use tokio::sync::OnceCell;
use std::{
	os::raw::c_char,
	sync::{Arc, Mutex},
	path::Path,
	ffi::CString,
	thread::{self, JoinHandle}
};

static SERVER: OnceCell<YgoServer> = OnceCell::const_new();

pub fn init<P: AsRef<Path>> (path: P) -> Result<(), Error> {
	YgoServer::init(path)
}

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
				thread: Mutex::new(None),
			})
		}
	}

	pub fn start (args: String) -> Result<(), Error> {
		let server: &YgoServer = SERVER.get().ok_or(anyhow!("start server error"))?;
		server.start_server(args);
		Ok(())
	}

	pub fn stop () -> Result<(), Error> {
		let server: &YgoServer = SERVER.get().ok_or(anyhow!("stop server error"))?;
		server.stop_server();
		Ok(())
	}

	fn start_server (&self, args: String) {
		let lib: Arc<Library> = self.lib.clone();

		let handle: JoinHandle<()> = thread::spawn(move || {
			unsafe {
				let start: Symbol<unsafe extern "C" fn(*const c_char) -> i32> =
					lib.get(b"start_server").unwrap();

				let c_args: CString = CString::new(args).unwrap();
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
