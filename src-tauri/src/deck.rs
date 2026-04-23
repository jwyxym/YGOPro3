use crate::game::{PATH, File};

use anyhow::{Error, Result, anyhow};
use std::{
	fs::{exists, write, rename, remove_file}, path::PathBuf
};
use walkdir::WalkDir;
use futures::{StreamExt, stream::FuturesUnordered};
use tokio::{
	task::{JoinHandle, spawn},
	fs::read_to_string
};
pub struct Deck;

impl Deck {
	pub async fn write (name: String, deck: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		write(path
			.join("deck")
			.join(name), 
			deck
		)?;
		Ok(())
	}
	pub async fn rename (old_name: String, new_name: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		let path = path
			.join("deck");

		let old_path: PathBuf = path
			.join(&old_name);
		let new_path: PathBuf = path
			.join(&new_name);

		if !exists(&old_path)? {
			return Err(anyhow!("deck not found"));
		}

		rename(old_path, new_path)?;
		Ok(())
	}
	pub async fn del (name: String) -> Result<(), Error> {
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;

		let file_path: PathBuf = path
			.join("deck")
			.join(&name);

		if !exists(&file_path)? {
			return Err(anyhow!("deck not found"));
		}

		remove_file(file_path)?;
		Ok(())
	}

	pub async fn get () -> Result<Vec<(String, String)>, Error> {
		let mut tasks: Vec<JoinHandle<Result<(String, String), Error>>> = Vec::new();
		let mut deck: Vec<(String, String)> = Vec::new();
		let path: &PathBuf = PATH.get().ok_or(anyhow!("get path error"))?;
		WalkDir::new(path.join("deck"))
			.max_depth(1)
			.into_iter()
			.for_each(|i| {
				if let Ok(i) = i {
					if let Some(file) = File::new(i.path()) {
						tasks.push(spawn(async move {
							let text: String = read_to_string(i.path()).await?;
							let name: &str = file.name();
							Ok((String::from(name), text))
						}));
					}
				}
			});
		let mut tasks: FuturesUnordered<JoinHandle<Result<(String, String), Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(i) = task {
					deck.push(i);
				}
			}
		}
		Ok(deck)
	}
}