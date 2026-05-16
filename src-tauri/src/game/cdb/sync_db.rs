use super::STMT;
use rusqlite::{Connection, Statement, Row};
use anyhow::{Result, Error, anyhow};
use std::ffi::c_char;
use libsqlite3_sys::{sqlite3_deserialize, sqlite3_malloc, sqlite3_free, SQLITE_DESERIALIZE_FREEONCLOSE, SQLITE_DESERIALIZE_RESIZEABLE};

pub fn init (data: Vec<u8>) -> Result<Vec<(u32, (Vec<i64>, Vec<String>))>, Error> {
	let conn: Connection = Connection::open_in_memory()?;
	let len: usize = data.len();
	if len > (i32::MAX as usize) {
		return Err(anyhow!("database buffer too large"));
	}
	let len_c_int: i32 = len as i32;
	let len_i64: i64 = len as i64;
	unsafe {
		let buf = sqlite3_malloc(len_c_int) as *mut u8;
		if buf.is_null() {
			return Err(anyhow!("sqlite3_malloc failed"));
		}
		std::ptr::copy_nonoverlapping(data.as_ptr(), buf, len as usize);

		let rc: i32 = sqlite3_deserialize(
			conn.handle(),
			b"main\0".as_ptr() as *const c_char,
			buf as *mut _,
			len_i64,
			len_i64,
			SQLITE_DESERIALIZE_FREEONCLOSE | SQLITE_DESERIALIZE_RESIZEABLE,
		);
		match rc {
			0 => {
				let mut stmt: Statement<'_> = conn.prepare(STMT)?;
				let iter = stmt
					.query_map([], |row: &Row<'_>| {
						let int: Vec<i64> = (0..12)
							.map(|i| row.get::<_, i64>(i))
							.collect::<Result<Vec<i64>, _>>()?;

						let string: Vec<String> = (12..30)
							.map(|i| row.get::<_, String>(i))
							.collect::<Result<Vec<String>, _>>()?;

						Ok((row.get(0)?, (int, string)))
					})?;
				Ok(iter.filter_map(Result::ok).collect())
			}
			_ => {
				if !buf.is_null() {
					sqlite3_free(buf as *mut _);
				}
				Err(anyhow!("sqlite error"))
			}
		}
	}
}