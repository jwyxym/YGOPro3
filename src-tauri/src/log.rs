use anyhow::{Error, Result, anyhow};
use std::{
	fs::{OpenOptions, File},
	io::Write,
	path::PathBuf,
	sync::OnceLock
};
use tokio::sync::{RwLock, RwLockWriteGuard};

static LOG: OnceLock<RwLock<Log>> = OnceLock::new();

pub fn init (path: &PathBuf) -> Result<(), Error> {
	if !LOG.get().is_some() {
		let log: Log = Log::new(path)?;
		let _ = LOG.set(RwLock::new(log));
	}
	Ok(())
}

pub async fn write (line: String) -> Result<(), Error> {
	let log: &RwLock<Log> = LOG.get().ok_or(anyhow!("log error"))?;
	let mut log: RwLockWriteGuard<'_, Log> = log.write().await;
	log.write(line)
}

#[derive(Debug)]
struct Log {
	file: File
}

impl Log {
	fn new (path: &PathBuf) -> Result<Self, Error> {
		let file: File = OpenOptions::new()
			.create(true)
			.append(true)
			.open(path.join("error.log"))?;
		Ok(Self {
			file
		})
	}

	fn write (&mut self, line: String) -> Result<(), Error> {
		writeln!(self.file, "{}", line)?;
		Ok(())
	}
}