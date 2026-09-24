
use std::{
	borrow::Cow,
	ffi::{CStr, c_char, c_int},
	fs::read,
	ptr::null_mut
};
use parking_lot::MutexGuard;
use anyhow::{Error, Result, anyhow};
use ygopro_server::defalut::*;
use ygopro3_emit::progress::*;

pub async fn init () -> Result<(
	DataManager, DeckManager, ConfigManager,
	Option<extern "C" fn(*const c_char, *mut c_int) -> *mut u8>,
	Option<extern "C" fn(u32, *mut CoreCard) -> u32>,
	Option<extern "C" fn(isize, u32) -> u32>
), Error> {
	let mut data_manager: DataManager = DataManager::new();
	let cards: Vec<ygopro3_card::Card> = ygopro3_game::get::cards().await?;
	for i in cards {
		let i: ygopro3_card::Card = i;
		data_manager.cards.insert(
			i.code,
			Card {
				card: CoreCard {
					code: i.code,
					alias: i.alias,
					setcode: i.setcode,
					card_type: Type::from_bits_retain(i.card_type),
					level: i.level,
					attribute: Attribute::from_bits_retain(i.attribute),
					race: Race::from_bits_retain(i.race),
					attack: i.attack,
					defense: i.defense,
					left_scale: i.lscale,
					right_scale: i.rscale,
					link_marker: Linkmarkers::from_bits_retain(i.link_marker),
					rule_code: 0,
				},
				ot: OT::from_bits_retain(i.ot),
				category: Category::from_bits_retain(i.category),
				name: i.name,
				text: i.desc,
				desc: i.hint,
			},
		);
	}
	data_manager.finalize_db();
	Ok((
		data_manager,
		DeckManager::new(),
		ConfigManager::new(),
		Some(script_reader),
		Some(card_reader),
		Some(core_message_handler)
	))
}

extern "C" fn script_reader (script_path: *const c_char, slen: *mut c_int) -> *mut u8 {
	fn read_file(file_path: &str, buffer: &mut [u8]) -> Result<usize, Error> {
		let data: Vec<u8> = read(file_path)?;
		let len: usize = data.len();
		if len >= buffer.len() {
			Err(anyhow!("too long memory"))
		} else {
			buffer[..len].copy_from_slice(&data);
			Ok(len)
		}
	}
	if script_path.is_null() || slen.is_null() {
		return null_mut();
	}
	let path: Cow<'_, str> = unsafe { CStr::from_ptr(script_path).to_string_lossy() };
	let mut buffer: MutexGuard<'_, [u8; 0x100000]> = SCRIPT_BUFFER.lock();

	if path.starts_with("./script") {
		(move || -> Result<*mut u8, Error> {
			let script_name: &str = &path[9..];
			let data: Vec<u8> = ygopro3_game::get::script(script_name)?;
			let len: usize = data.len();
			if len >= buffer.len() {
				Err(anyhow!("too long memory"))
			} else {
				buffer[..len].copy_from_slice(&data);
				unsafe {
					*slen = len as c_int;
				}
				Ok(buffer.as_mut_ptr())
			}
		})()
		.unwrap_or(null_mut())
	} else {
		(move || -> Result<*mut u8, Error> {
			let len: usize = read_file(path.as_ref(), &mut *buffer)?;
			unsafe {
				*slen = len as c_int;
			}
			Ok(buffer.as_mut_ptr())
		})()
		.unwrap_or(null_mut())
	}
}

extern "C" fn core_message_handler (pduel: isize, _message_type: u32) -> u32 {
	let msg: String = ygopro_server::defalut::get_log_message(pduel);
	emit(Event::Debug, msg);
	0
}