use crate::PATH;
use crate::file::File;

use walkdir::WalkDir;
use anyhow::{Error, Result, anyhow};
use std::{
	fs::{exists, remove_file, read, write, create_dir_all, rename}, path::PathBuf
};
use chrono::{Local, prelude::DateTime};
pub struct Yrp;

impl Yrp {
	pub async fn del (name: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let file_path: PathBuf = path
			.join("replay")
			.join(name);

		if !exists(&file_path)? {
			return Err(anyhow!("replay not found"));
		}

		remove_file(file_path)?;
		Ok(())
	}
	pub async fn rename (from: String, to: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let path: PathBuf = path
			.join("replay");

		let from: PathBuf = path
			.join(from);

		if !exists(&from)? {
			return Err(anyhow!("replay not found"));
		}

		let to: PathBuf = path
			.join(to);

		rename(from, to)?;
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

	pub async fn save (buffer: &Vec<u8>) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let now: DateTime<Local> = Local::now();
		let name: String = format!("{}.yrp3d", now.format("%Y-%m-%d-%H-%M-%S"));
		let path: PathBuf = path.join("replay");
		create_dir_all(&path)?;
		let path: PathBuf = path.join(name);
		Ok(write(path, buffer)?)
	}
}