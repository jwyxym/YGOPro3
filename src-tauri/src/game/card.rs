use tokio_rusqlite::Connection;
use std::{collections::BTreeMap, path::Path};
use anyhow::{Result, Error, anyhow};

pub struct Card {
	name: String,
	content: BTreeMap<i64, (Vec<i64>, Vec<String>)>
}

impl Card  {
	pub fn new (name: String) -> Self {
		Self {
			name: name,
			content: BTreeMap::new()
		}
	}
	pub async fn init<P: AsRef<Path>> (&mut self, path: P) -> Result<(), Error> {
		let conn: Connection = Connection::open(path).await?;
		let results: Vec<(i64, (Vec<i64>, Vec<String>))> = conn
			.call(|conn| {
				let mut stmt = conn.prepare("SELECT * FROM datas, texts WHERE datas.id = texts.id")?;
				
				let result = stmt.query_map([], |row| {
					let int: Vec<i64> = (0..12)
						.map(|i| row.get::<_, i64>(i))
						.collect::<Result<Vec<i64>, _>>()?;
					
					let string: Vec<String> = (12..30)
						.map(|i| row.get::<_, String>(i))
						.collect::<Result<Vec<String>, _>>()?;
					
					Ok((int[0], (int, string)))
				})?;

				Ok::<Vec<(i64, (Vec<i64>, Vec<std::string::String>))>, Error>(result
					.filter_map(Result::ok)
					.collect()
				)
			})
			.await
			.map_err(|e| anyhow!("{}", e))?;

		results.into_iter().for_each(|i| {
			self.content.insert(i.0, i.1);
		});
		
		Ok(())
	}

	pub fn to_array (&self) -> Vec<(Vec<i64>, Vec<String>)> {
		self.content.values().cloned().collect()
	}
}