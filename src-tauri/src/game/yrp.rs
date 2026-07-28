use crate::PATH;
use crate::file::File;

use walkdir::WalkDir;
use anyhow::{Error, Result, anyhow};
use std::{
	fs::{
		create_dir_all,
		exists,
		read,
		remove_file,
		rename,
		write
	},
	path::PathBuf
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

	pub async fn save (mut name: String, content: &[u8]) -> Result<String, Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		if !name.ends_with(".yrp3d") {
			name = format!("{}.yrp3d", name);
		}
		let path: PathBuf = path.join("replay");
		create_dir_all(&path)?;
		if exists(&path)? || write(path.join(&name), &content).is_err() {
			let now: DateTime<Local> = Local::now();
			name = format!("{}.yrp3d", now.format("%Y-%m-%d-%H-%M-%S"));
			write(path.join(&name), content)?;
		}
		Ok(name)
	}
}