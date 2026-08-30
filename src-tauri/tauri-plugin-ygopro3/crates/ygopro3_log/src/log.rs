use anyhow::{Error, Result, anyhow};
use std::{
	fs::{OpenOptions, File},
	io::Write,
	path::PathBuf,
	sync::{Mutex, MutexGuard, OnceLock}
};

static LOG: OnceLock<Mutex<Log>> = OnceLock::new();

pub fn init (path: &PathBuf) -> Result<(), Error> {
	if !LOG.get().is_some() {
		let log: Log = Log::new(path)?;
		let _ = LOG.set(Mutex::new(log));
	}
	Ok(())
}

pub fn write (line: String) -> Result<(), Error> {
	let log: &Mutex<Log> = LOG.get().ok_or(anyhow!("log error"))?;
	let mut log: MutexGuard<'_, Log> = log
		.lock()
		.map_err(|err| anyhow!("log lock poisoned: {}", err))?;
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