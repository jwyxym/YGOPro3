use crate::game::PATH;
use crate::file::File;

use walkdir::WalkDir;
use anyhow::{Error, Result, anyhow};
use std::{
	fs::{exists, remove_file}, path::PathBuf
};
pub struct Ypk;

impl Ypk {
	pub async fn del (name: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let file_path: PathBuf = path
			.join("expansions")
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
			.join("expansions")
			.join(&name);

		Ok(exists(&file_path)?)
	}
	
	pub async fn get () -> Result<Vec<String>, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let path: PathBuf = path.join("expansions");
		Ok(WalkDir::new(path)
			.max_depth(1)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if ["ypk", "zip"].contains(&file.ext()) {
							return Some(String::from(file.name()));
						}
					}
				}
				None
			})
			.collect()
		)
	}
}