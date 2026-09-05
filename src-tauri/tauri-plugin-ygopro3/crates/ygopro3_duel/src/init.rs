
use std::{
	borrow::Cow,
	ffi::{CStr, c_char, c_int},
	fs::read,
	ptr::null_mut
};
use parking_lot::{Mutex, MutexGuard};
use anyhow::{Error, Result, anyhow};
use ygopru::{
	ygopro::{
		managers::{
			config_manager::{ConfigManager, set_global as set_config_manager},
			data_manager::{DataManager, card_reader, set_global as set_data_manager},
			deck_manager::{DeckManager, set_global as set_deck_manager},
		},
	},
	ygopro_core_wrapper::{
		get_log_message,
		set_card_reader,
		set_message_handler,
		set_script_reader,
	},
	ygopro_data::{
		constants::{Attribute, Category, Linkmarkers, OT, Race, Type},
		data::{CoreCard, Card},
	},
};

static SCRIPT_BUFFER: Mutex<[u8; 0x100000]> = Mutex::new([0u8; 0x100000]);

pub async fn init () -> Result<(), Error> {
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
	let deck_manager: DeckManager = DeckManager::new();
	let config_manager: ConfigManager = ConfigManager::new();
	set_config_manager(config_manager);
	set_data_manager(data_manager);
	set_deck_manager(deck_manager);
	unsafe {
		set_script_reader(Some(script_reader));
		set_card_reader(Some(card_reader));
		set_message_handler(Some(core_message_handler));
	}
	Ok(())
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

extern "C" fn core_message_handler (pduel: isize, message_type: u32) -> u32 {
	let mut buffer: [u8; 1024] = [0u8; 1024];
	unsafe {
		get_log_message(pduel, buffer.as_mut_ptr());
	}
	let c_message: &CStr = unsafe { CStr::from_ptr(buffer.as_ptr() as *const c_char) };
	println!(
		"core message[{}]: {}",
		message_type,
		c_message.to_string_lossy()
	);
	0
}