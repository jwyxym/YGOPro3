use anyhow::{Error, Result, anyhow};
use parking_lot::{Mutex, MutexGuard};
use std::{
	borrow::Cow,
	ffi::{CStr, c_char, c_int},
	fs::read,
	ptr::null_mut,
	sync::OnceLock,
	thread::JoinHandle,
	time::Duration,
	sync::mpsc::{Sender, Receiver, channel}
};
use tokio::{net::TcpListener, sync::oneshot};
use ygopru::{
	ygopro::{
		DuelHost,
		cli::{build_duel_host, start_local_server_with_listener},
		managers::{
			config_manager::{self, ConfigManager},
			data_manager::{self, DataManager},
			deck_manager::{self, DeckManager},
		},
	},
	ygopro_core_wrapper::{
		get_log_message, random::SEED_COUNT, set_card_reader, set_message_handler,
		set_script_reader,
	},
	ygopro_data::{
		constants::{Attribute, Category, Linkmarkers, MasterRule, Mode, OT, Race, Rule, Type},
		data::{Card, CoreCard, ReplayMode},
		message::HostInfo,
	},
};

static SERVER_CONTROL: OnceLock<Mutex<Option<ServerControl>>> = OnceLock::new();
static SCRIPT_BUFFER: Mutex<[u8; 0x100000]> = Mutex::new([0u8; 0x100000]);

struct ServerControl {
	shutdown_sender: oneshot::Sender<()>,
	server_thread: JoinHandle<()>,
}

pub fn start_server(
	lflist: u32,
	rule: u8,
	mode: u8,
	replay_mode: u32,
	duel_rule: bool,
	no_check_deck: bool,
	no_shuffle_deck: bool,
	start_lp: u32,
	start_hand: u8,
	draw_count: u8,
	time_limit: u16,
) -> Result<u16, Error> {
	let seeds: Vec<[u32; SEED_COUNT]> = Vec::new();
	let replay_mode: ReplayMode = ReplayMode::from_bits_retain(replay_mode);
	let duel_rule: MasterRule = if duel_rule {
		MasterRule::MasterRuleNew
	} else {
		MasterRule::MasterRule2020
	};
	let mode: Mode = Mode::try_from(mode).unwrap_or(Mode::Single);
	let host_info: HostInfo = HostInfo {
		lflist: lflist,
		rule: Rule::try_from(rule).unwrap_or(Rule::All),
		duel_rule,
		no_check_deck,
		no_shuffle_deck,
		start_lp,
		start_hand,
		draw_count,
		time_limit,
		mode,
	};

	let server_control_lock: &Mutex<Option<ServerControl>> =
		SERVER_CONTROL.get_or_init(|| Mutex::new(None));
	let mut server_control: MutexGuard<'_, Option<ServerControl>> = server_control_lock.lock();
	let old_server_control: Option<ServerControl> = server_control.take();
	if let Some(i) = old_server_control {
		let i: ServerControl = i;
		i.shutdown_sender.send(()).ok();
		i.server_thread.join().ok();
	}

	let (shutdown_sender, shutdown_receiver): (oneshot::Sender<()>, oneshot::Receiver<()>) =
		oneshot::channel();
	let (start_result_sender, start_result_receiver): (
		Sender<Result<u16, i32>>,
		Receiver<Result<u16, i32>>,
	) = channel();
	let server_thread: JoinHandle<()> = std::thread::spawn(move || {
		let runtime: tokio::runtime::Runtime = match tokio::runtime::Builder::new_multi_thread()
			.enable_all()
			.build()
		{
			Ok(runtime) => runtime,
			Err(_) => {
				start_result_sender.send(Err(-1)).ok();
				return;
			}
		};

		runtime.block_on(async move {
			let init_result: Result<(), Error> = init().await;
			if let Err(_) = init_result {
				start_result_sender.send(Err(-1)).ok();
				return;
			}
			let run_result: Result<(), Error> = run_tcp_server(
				replay_mode,
				host_info,
				seeds,
				shutdown_receiver,
				start_result_sender,
			)
			.await;
			let _: Result<(), Error> = run_result;
		});
		runtime.shutdown_timeout(Duration::from_secs(2));
	});

	*server_control = Some(ServerControl {
		shutdown_sender,
		server_thread,
	});
	start_result_receiver
		.recv()?
		.map_err(|_| anyhow!("ygoserver runtime error"))
}

pub fn stop_server() {
	let server_control: Option<ServerControl> = {
		let server_control_lock: &Mutex<Option<ServerControl>> =
			SERVER_CONTROL.get_or_init(|| Mutex::new(None));
		server_control_lock.lock().take()
	};

	if let Some(server_control) = server_control {
		let server_control: ServerControl = server_control;
		server_control.shutdown_sender.send(()).ok();
		server_control.server_thread.join().ok();
	}
}

async fn run_tcp_server(
	replay_mode: ReplayMode,
	host_info: HostInfo,
	seeds: Vec<[u32; SEED_COUNT]>,
	shutdown_receiver: oneshot::Receiver<()>,
	start_result_sender: Sender<Result<u16, i32>>,
) -> Result<(), Error> {
	let listener: TcpListener = TcpListener::bind("0.0.0.0:0").await?;
	let port: u16 = listener.local_addr()?.port();

	start_result_sender.send(Ok(port)).ok();

	let duel: DuelHost = build_duel_host(host_info, replay_mode, seeds);
	tokio::select! {
		_ = shutdown_receiver => {}
		_ = start_local_server_with_listener(listener, duel) => {}
	}

	Ok(())
}

async fn init() -> Result<(), Error> {
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
	config_manager::set_global(config_manager);
	data_manager::set_global(data_manager);
	deck_manager::set_global(deck_manager);
	unsafe {
		set_script_reader(Some(script_reader));
		set_card_reader(Some(data_manager::card_reader));
		set_message_handler(Some(core_message_handler));
	}
	Ok(())
}

extern "C" fn script_reader(script_path: *const c_char, slen: *mut c_int) -> *mut u8 {
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

extern "C" fn core_message_handler(pduel: isize, message_type: u32) -> u32 {
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
