use crate::game::PATH;

use anyhow::{Error, Result, anyhow};
use std::{
	fs::{exists, remove_file}, path::PathBuf
};
pub struct Ypk;

impl Ypk {
	pub async fn del (name: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let file_path: PathBuf = path
			.join("expnasions")
			.join(&name);

		if !exists(&file_path)? {
			return Err(anyhow!("deck not found"));
		}

		remove_file(file_path)?;
		Ok(())
	}
	pub async fn exists (name: String) -> Result<bool, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let file_path: PathBuf = path
			.join("expnasions")
			.join(&name);

		Ok(exists(&file_path)?)
	}
}