use tokio_rusqlite::Connection;
use anyhow::{Result, Error, anyhow};
use std::path::Path;

pub async fn init<P: AsRef<Path>> (path: P) -> Result< Vec<(u32, (Vec<u32>, Vec<String>))>, Error> {
	let conn: Connection = Connection::open(path).await?;
	conn
		.call(|conn| {
			let mut stmt = conn.prepare("SELECT * FROM datas, texts WHERE datas.id = texts.id")?;
			
			let result = stmt.query_map([], |row| {
				let int: Vec<u32> = (0..12)
					.map(|i| row.get::<_, u32>(i))
					.collect::<Result<Vec<u32>, _>>()?;
				
				let string: Vec<String> = (12..30)
					.map(|i| row.get::<_, String>(i))
					.collect::<Result<Vec<String>, _>>()?;
				
				Ok((int[0], (int, string)))
			})?;

			Ok::<Vec<(u32, (Vec<u32>, Vec<String>))>, Error>(result
				.filter_map(Result::ok)
				.collect()
			)
		})
		.await
		.map_err(|e| anyhow!("{}", e))
}