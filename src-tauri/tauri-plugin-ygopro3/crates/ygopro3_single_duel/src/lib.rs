use anyhow::{Result, Error, anyhow};
use binrw::BinRead;
use futures::SinkExt;
use hashbrown::HashMap;
use parking_lot::Mutex;
use tokio_stream::StreamExt;
use tokio_util::codec::LengthDelimitedCodec;
use tokio::{
	net::TcpListener,
	sync::oneshot
};
use std::{
	io::Cursor,
	sync::OnceLock,
	thread::JoinHandle,
	time::Duration,
	ffi::{CStr, c_int, c_char},
	ptr::null_mut,
	fs::read
};
use ygopru::{
	ygopro::{
		Configuration,
		managers::{ deck_manager::{self, DeckManager}, config_manager::{self, ConfigManager}, data_manager::{self, DataManager} },
		single_duel::SingleDuelHost,
		plugin::replay::{NAME, Configuration as PluginConfiguration}
	},
	ygopro_core_wrapper::{
		set_script_reader,
        set_card_reader,
        set_message_handler,
		get_log_message,
		DuelSeed,
		random::SEED_COUNT
	},
	ygopro_data::{
		data::{ReplayMode, Card, CoreCard},
		message::{HostInfo, ctos},
		constants::{MasterRule, Mode, Rule, Category, OT, Type, Race, Attribute, Linkmarkers}
	},
	ygopro_handler::RoomProvider
};

static SERVER_CONTROL: OnceLock<Mutex<Option<ServerControl>>> = OnceLock::new();
static SERVER_SEEDS: OnceLock<Mutex<Vec<[u32; SEED_COUNT]>>> = OnceLock::new();
static SCRIPT_BUFFER: Mutex<[u8; 0x100000]> = Mutex::new([0u8; 0x100000]);

struct ServerControl {
	shutdown_sender: oneshot::Sender<()>,
	server_thread: JoinHandle<()>,
}

pub fn start_server (
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
	time_limit: u16
) -> Result<u16, Error> {
	let seeds: Vec<[u32; 8]>= Vec::new();
	let replay_mode: ReplayMode = ReplayMode::from_bits_retain(replay_mode);
	let duel_rule: MasterRule = if duel_rule {
		MasterRule::MasterRuleNew
	} else {
		MasterRule::MasterRule2020
	};
	let mode: Mode = if mode > 2 {
		Mode::Single
	} else {
		Mode::try_from(mode).unwrap_or(Mode::Single)
	};
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
        mode
    };

	let server_control_lock = SERVER_CONTROL.get_or_init(|| Mutex::new(None));
	let mut server_control = server_control_lock.lock();
	if let Some(i) = server_control.take() {
		i.shutdown_sender.send(()).ok();
		i.server_thread.join().ok();
	}

	*SERVER_SEEDS.get_or_init(|| Mutex::new(Vec::new())).lock() = seeds.clone();

	let (shutdown_sender, shutdown_receiver) = oneshot::channel();
	let (start_result_sender, start_result_receiver) = std::sync::mpsc::channel();
	let server_thread = std::thread::spawn(move || {
		let runtime = match tokio::runtime::Builder::new_multi_thread()
			.enable_all()
			.build()
		{
			Ok(runtime) => runtime,
			Err(_) => {
				start_result_sender.send(Err(- 1)).ok();
				return;
			}
		};

		runtime.block_on(async move {
			if let Err(_) = init().await {
				start_result_sender.send(Err(- 1)).ok();
				return;
			}
			let _ = run_tcp_server(replay_mode, host_info, shutdown_receiver, start_result_sender).await;
		});
		runtime.shutdown_timeout(Duration::from_secs(2));
	});

	*server_control = Some(ServerControl {
		shutdown_sender,
		server_thread,
	});
	start_result_receiver.recv()?
		.map_err(|_|anyhow!("ygoserver runtime error"))
}

pub fn stop_server () {
	let server_control = {
		let server_control_lock = SERVER_CONTROL.get_or_init(|| Mutex::new(None));
		server_control_lock.lock().take()
	};

	if let Some(server_control) = server_control {
		server_control.shutdown_sender.send(()).ok();
		server_control.server_thread.join().ok();
	}
}

async fn run_tcp_server (
	replay_mode: ReplayMode,
	host_info: HostInfo,
	mut shutdown_receiver: oneshot::Receiver<()>,
	start_result_sender: std::sync::mpsc::Sender<Result<u16, i32>>
) -> Result<(), Error> {
	let listener: TcpListener = TcpListener::bind("0.0.0.0:0").await?;
	let port: u16 = listener.local_addr()?.port();

	start_result_sender.send(Ok(port)).ok();

    let mut configuration: Configuration = Configuration::default();
	configuration.seed_generator = Some(Box::new(seed_generator));
    configuration.enable_plugin_with_configuration(NAME, PluginConfiguration { mode: replay_mode });
	let (mut duel, duel_handle) = SingleDuelHost::new(host_info, configuration);
	let mut client_tasks = Vec::new();

	loop {
		tokio::select! {
			_ = &mut shutdown_receiver => {
				break;
			}
			accepted = listener.accept() => {
				let (stream, _address) = accepted?;
				let (reader, writer) = stream.into_split();
				let framed_read = LengthDelimitedCodec::builder()
					.length_field_type::<u16>()
					.little_endian()
					.new_read(reader);
				let mut framed_write = LengthDelimitedCodec::builder()
					.length_field_type::<u16>()
					.little_endian()
					.new_write(writer);

				let client_to_server_stream = framed_read.filter_map(|result| match result {
					Ok(frame) => {
						let mut cursor = Cursor::new(&frame);
						ctos::Message::read_le(&mut cursor).ok()
					}
					Err(_) => None,
				});

				let mut server_to_client_stream = duel.add(client_to_server_stream);

				client_tasks.retain(|task: &tokio::task::JoinHandle<()>| !task.is_finished());
				let client_task = tokio::spawn(async move {
					while let Some(message) = server_to_client_stream.next().await {
						framed_write.send(message.data).await.ok();
					}
				});
				client_tasks.push(client_task);
			}
		}
	}

	duel_handle.abort();
	duel_handle.await.ok();
	for client_task in client_tasks {
		client_task.abort();
		client_task.await.ok();
	}
	Ok(())
}

async fn init () -> Result<(), Error> {
	let mut hash_map: HashMap<u32, Card> = HashMap::new();
	let cards = ygopro3_game::get::cards().await?;
	for i in cards {
		hash_map.insert(i.code, Card {
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
				rule_code: 0
			},
			ot: OT::from_bits_retain(i.ot),
			category: Category::from_bits_retain(i.category),
			name: i.name,
			text: i.desc,
			desc: i.hint
		});
	}
	let data_manager: DataManager = DataManager {
		cards: hash_map,
		extra_setcode: HashMap::new()
	};
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

extern "C" fn script_reader (script_path: *const c_char, slen: *mut c_int) -> *mut u8 {
	fn read_file (file_path: &str, buffer: &mut [u8]) -> Result<usize, Error> {
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
	let path = unsafe { CStr::from_ptr(script_path).to_string_lossy() };
	let mut buffer = SCRIPT_BUFFER.lock();

	if path.starts_with("./script") {
		(move || -> Result<*mut u8, Error> {
			let script_name: &str = &path[9..];
			let data: Vec<u8> = ygopro3_game::get::script(script_name)?;
			let len: usize = data.len();
			if len >= buffer.len() {
				Err(anyhow!("too long memory"))
			} else {
				buffer[..len].copy_from_slice(&data);
				unsafe { *slen = len as c_int; }
				Ok(buffer.as_mut_ptr())
			}
		})().unwrap_or(null_mut())
	} else {
		(move || -> Result<*mut u8, Error> {
			let len: usize = read_file(path.as_ref(), &mut *buffer)?;
			unsafe { *slen = len as c_int; }
			Ok(buffer.as_mut_ptr())
		})().unwrap_or(null_mut())
	}
}

fn seed_generator (duel_count: u8) -> DuelSeed {
	let seed = SERVER_SEEDS
		.get()
		.and_then(|seeds| seeds.lock().get(duel_count as usize).copied());
	match seed {
		Some(seed) => DuelSeed::Complicated(seed),
		None => DuelSeed::None,
	}
}

extern "C" fn core_message_handler (pduel: isize, message_type: u32) -> u32 {
	let mut buffer = [0u8; 1024];
	unsafe { get_log_message(pduel, buffer.as_mut_ptr()); }
	let c_message = unsafe { CStr::from_ptr(buffer.as_ptr() as *const c_char) };
	println!("core message[{}]: {}", message_type, c_message.to_string_lossy());
	0
}
