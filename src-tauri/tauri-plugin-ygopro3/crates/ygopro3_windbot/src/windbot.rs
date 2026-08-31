use libloading::{Library, Symbol};
use anyhow::{Error, Result};
use std::{
	os::raw::c_char,
	sync::{Arc, Mutex},
	path::Path,
	ffi::{CString, CStr},
	thread::{self, JoinHandle}
};

#[derive(Debug)]
pub struct WindBot {
	lib: Arc<Library>,
	thread: Mutex<Option<JoinHandle<()>>>,
}

impl WindBot {
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

	pub fn get_list (&self) -> String {
		|| -> Result<String, Error> {
			unsafe {
				let windbot_list: Symbol<unsafe extern "C" fn() -> *const c_char> = self.lib.get(b"windbot_list")?;
				let windbot_free: Symbol<unsafe extern "C" fn(*const c_char)> = self.lib.get(b"windbot_free")?;

				let ptr = windbot_list();

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

	pub fn start_bot (&self, args: String) {
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

	pub fn shutdown (&self) -> Result<(), Error> {
		if let Ok(mut lock) = self.thread.lock() {
			if let Some(handle) = lock.take() {
				let _ = handle.join();
			}
		}

		Ok(())
	}
}
