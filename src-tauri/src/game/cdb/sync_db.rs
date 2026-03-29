use super::STMT;
use rusqlite::{Connection, Statement, Row};
use anyhow::{Result, Error, anyhow};
use std::{mem, ffi::c_char};
use libsqlite3_sys::{sqlite3_deserialize, SQLITE_DESERIALIZE_FREEONCLOSE, SQLITE_DESERIALIZE_RESIZEABLE};

pub fn init (mut data: Vec<u8>) -> Result<Vec<(u32, (Vec<i64>, Vec<String>))>, Error> {
	let conn: Connection = Connection::open_in_memory()?;
	let ptr: *mut u8 = data.as_mut_ptr();
	let len: i64 = data.len() as i64;
	data.shrink_to_fit();
	let capacity: usize = data.capacity();
	mem::forget(data);
	unsafe {
		let rc: i32 = sqlite3_deserialize(
			conn.handle(),
			b"main\0".as_ptr() as *const c_char,
			ptr,
			len,
			len,
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
				if !ptr.is_null() {
					let _ = Vec::from_raw_parts(ptr as *mut u8, len as usize, capacity);
				}
				Err(anyhow!("sqlite error"))
			}
		}
	}
}