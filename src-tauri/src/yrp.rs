use crate::PATH;
use crate::file::File;

use walkdir::WalkDir;
use anyhow::{Error, Result, anyhow};
use std::{
	fs::{exists, remove_file, read}, path::PathBuf
};
pub struct Yrp;

impl Yrp {
	pub async fn del (name: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let file_path: PathBuf = path
			.join("replay")
			.join(&name);

		if !exists(&file_path)? {
			return Err(anyhow!("replay not found"));
		}

		remove_file(file_path)?;
		Ok(())
	}
	
	pub async fn get () -> Result<Vec<String>, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let path: PathBuf = path.join("replay");
		Ok(WalkDir::new(path)
			.max_depth(1)
			.into_iter()
			.filter_map(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						if file.ext() == "yrp3d" {
							return Some(String::from(file.name()));
						}
					}
				}
				None
			})
			.collect()
		)
	}
	
	pub async fn read (name: String) -> Result<Vec<u8>, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let path: PathBuf = path.join("replay").join(name);
		Ok(read(path)?)
	}
}