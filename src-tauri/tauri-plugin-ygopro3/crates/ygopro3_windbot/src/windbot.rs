use anyhow::{Error, Result};
use std::{
	sync::Mutex,
	thread::{self, JoinHandle}
};
use ygopro3_emit::progress::*;

#[derive(Debug)]
pub struct WindBot {
	thread: Mutex<Option<JoinHandle<()>>>,
}

impl WindBot {
	pub fn new () -> Self {
		Self {
			thread: Mutex::new(None)
		}
	}

	pub fn get_list (&self) -> Result<String, Error> {
		Ok(windbot_rs::list_bots()?)
	}

	pub fn start_bot (&self, options: String) {
		let handle: JoinHandle<()> = thread::spawn(move || {
			if let Err(error) = windbot_rs::run(Some(&options)) {
				emit(Event::Debug, error.to_string());
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