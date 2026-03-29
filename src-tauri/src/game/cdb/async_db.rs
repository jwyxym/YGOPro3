use super::STMT;
use tokio_rusqlite::Connection;
use anyhow::{Result, Error, anyhow};
use std::path::Path;

pub async fn init<P: AsRef<Path>> (path: P) -> Result<Vec<(u32, (Vec<i64>, Vec<String>))>, Error> {
	let conn: Connection = Connection::open(path).await?;
	conn
		.call(|conn| {
			let mut stmt = conn.prepare(STMT)?;
			
			let result = stmt.query_map([], |row| {
				if let Err(e) = (0..12)
					.map(|i| row.get::<_, i64>(i))
					.collect::<Result<Vec<i64>, _>>() {
						println!("{:?}", e);
				}
				let int: Vec<i64> = (0..12)
					.map(|i| row.get::<_, i64>(i))
					.collect::<Result<Vec<i64>, _>>()?;
				
				let string: Vec<String> = (12..30)
					.map(|i| row.get::<_, String>(i))
					.collect::<Result<Vec<String>, _>>()?;
				
				Ok((row.get(0)?, (int, string)))
			})?;

			Ok::<Vec<(u32, (Vec<i64>, Vec<String>))>, Error>(result
				.filter_map(Result::ok)
				.collect()
			)
		})
		.await
		.map_err(|e| anyhow!("{}", e))
}