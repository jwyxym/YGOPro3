mod runner;
mod global;

use anyhow::{anyhow, Error, Result};
use std::sync::mpsc;

pub fn load (name: String, script: &str) -> Result<String, Error> {
	let (reply, rx) = mpsc::channel();

	runner::sender()
		.send(runner::Command::Load {
			name: name.clone(),
			script: script.to_string(),
			reply
		})
		.map_err(|err| anyhow!("extend worker disconnected: {}", err))?;

	runner::receive(rx)?;
	Ok(name)
}

pub fn call (name: String, args: String) -> Result<String, Error> {
	let (reply, rx) = mpsc::channel();

	runner::sender()
		.send(runner::Command::Call {
			name: name.clone(),
			args,
			reply
		})
		.map_err(|err| anyhow!("extend worker disconnected: {}", err))?;

	runner::receive(rx)
}

pub fn unload (name: String) -> Result<(), Error> {
	let (reply, rx) = mpsc::channel();

	runner::sender()
		.send(runner::Command::Unload {
			name: name.clone(),
			reply
		})
		.map_err(|err| anyhow!("extend worker disconnected: {}", err))?;

	runner::receive(rx)
}

pub fn unload_all () -> Result<(), Error> {
	let (reply, rx) = mpsc::channel();

	runner::sender()
		.send(runner::Command::UnloadAll {
			reply
		})
		.map_err(|err| anyhow!("extend worker disconnected: {}", err))?;

	runner::receive(rx)
}
