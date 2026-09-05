use anyhow::{Error, Result, anyhow};
use parking_lot::{Mutex, MutexGuard};
use std::{
	sync::OnceLock,
	sync::mpsc::{Receiver as StartResultReceiver, Sender as StartResultSender, channel},
	thread::{JoinHandle, spawn},
	time::Duration,
};
use tokio::{
	net::TcpListener,
	runtime::{Builder, Runtime},
	select,
	sync::oneshot::{
		Receiver as ShutdownReceiver,
		Sender as ShutdownSender,
		channel as shutdown_channel,
	},
};
use ygopru::{
	ygopro::{
		DuelHost,
		cli::{
			build_duel_host,
			start_local_server_with_listener
		}
	},
	ygopro_core_wrapper::random::SEED_COUNT,
	ygopro_data::{
		constants::{MasterRule, Mode, Rule},
		data::ReplayMode,
		message::HostInfo,
	},
};

static SERVER_CONTROL: OnceLock<Mutex<Option<ServerControl>>> = OnceLock::new();

struct ServerControl {
	shutdown_sender: ShutdownSender<()>,
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

	let (shutdown_sender, shutdown_receiver): (ShutdownSender<()>, ShutdownReceiver<()>) =
		shutdown_channel();
	let (start_result_sender, start_result_receiver): (
		StartResultSender<Result<u16, i32>>,
		StartResultReceiver<Result<u16, i32>>,
	) = channel();
	let server_thread: JoinHandle<()> = spawn(move || {
		let runtime: Runtime = match Builder::new_multi_thread()
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
			let init_result: Result<(), Error> = super::init().await;
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

pub fn stop_server () {
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

async fn run_tcp_server (
	replay_mode: ReplayMode,
	host_info: HostInfo,
	seeds: Vec<[u32; SEED_COUNT]>,
	shutdown_receiver: ShutdownReceiver<()>,
	start_result_sender: StartResultSender<Result<u16, i32>>,
) -> Result<(), Error> {
	let listener: TcpListener = TcpListener::bind("0.0.0.0:0").await?;
	let port: u16 = listener.local_addr()?.port();

	start_result_sender.send(Ok(port)).ok();

	let duel: DuelHost = build_duel_host(host_info, replay_mode, seeds);
	select! {
		_ = shutdown_receiver => {}
		_ = start_local_server_with_listener(listener, duel) => {}
	}

	Ok(())
}