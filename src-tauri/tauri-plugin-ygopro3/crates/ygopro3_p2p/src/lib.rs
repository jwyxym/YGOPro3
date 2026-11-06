mod ticket;
mod tunnel;

use ygopro3_const::{P2P_ALPN, P2P_CONNECT_TIMEOUT, P2P_JOIN_TIMEOUT, P2P_RELAY_TIMEOUT, P2P_SHUTDOWN_TIMEOUT};
use ygopro3_game::get::SystemReadGuard;

use anyhow::{Context, Error, anyhow};
use iroh::{Endpoint, RelayMode, RelayUrl, endpoint::{Builder, QuicTransportConfig, presets::Minimal}};
use serde::{Deserialize, Serialize};
use std::{future::Future, net::{Ipv4Addr, SocketAddrV4}, sync::OnceLock};
use tokio::{
	net::TcpListener,
	sync::{Mutex, MutexGuard, watch},
	task::JoinHandle,
	time::{Instant, timeout, timeout_at}
};
use uuid::Uuid;

use ticket::Ticket;

static SESSION: Mutex<Option<Session>> = Mutex::const_new(None);
static CANCEL: OnceLock<watch::Sender<u64>> = OnceLock::new();

fn cancellation() -> &'static watch::Sender<u64> {
	CANCEL.get_or_init(|| {
		let (sender, _receiver): (watch::Sender<u64>, watch::Receiver<u64>) = watch::channel(0);
		sender
	})
}

async fn run_start<T, F>(future: F) -> Result<T, Error>
where
	F: Future<Output = Result<T, Error>>,
{
	let mut cancelled: watch::Receiver<u64> = cancellation().subscribe();
	let generation: u64 = *cancelled.borrow_and_update();
	let result: Result<T, Error> = tokio::select! {
		biased;
		_ = cancelled.changed() => return Err(anyhow!("P2P operation cancelled")),
		result = future => result,
	};
	if *cancelled.borrow() != generation {
		return Err(anyhow!("P2P operation cancelled"));
	}
	result
}

struct PendingEndpoint {
	endpoint: Endpoint,
	committed: bool,
}

impl Drop for PendingEndpoint {
	fn drop(&mut self) {
		if !self.committed {
			let endpoint: Endpoint = self.endpoint.clone();
			tokio::spawn(async move {
				let _ = timeout(P2P_SHUTDOWN_TIMEOUT, endpoint.close()).await;
			});
		}
	}
}

#[derive(Default, Deserialize)]
#[serde(default)]
pub struct P2pConfig {
	pub relay_urls: Vec<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
	Host,
	Join,
}

#[derive(Clone, Serialize)]
pub struct SessionInfo {
	pub mode: Mode,
	pub endpoint_id: String,
	pub room_code: Option<String>,
	pub local_address: String,
	pub running: bool,
}

struct Session {
	endpoint: Endpoint,
	task: JoinHandle<()>,
	info: SessionInfo,
}

impl Session {
	async fn shutdown(mut self) {
		self.task.abort();
		let _ = (&mut self.task).await;
		let _ = timeout(P2P_SHUTDOWN_TIMEOUT, self.endpoint.close()).await;
	}
}

impl Drop for Session {
	fn drop(&mut self) {
		self.task.abort();
	}
}

async fn available_session() -> Result<MutexGuard<'static, Option<Session>>, Error> {
	let mut session: MutexGuard<'static, Option<Session>> = SESSION.lock().await;
	if session.as_ref().is_some_and(|session: &Session| !session.task.is_finished()) {
		return Err(anyhow!("P2P session is already running; stop it before starting another"));
	}
	if let Some(previous) = session.take() {
		let previous: Session = previous;
		previous.shutdown().await;
	}
	Ok(session)
}

async fn endpoint() -> Result<Endpoint, Error> {
	let relay_mode: RelayMode = {
		let system: SystemReadGuard = ygopro3_game::get::system().await?;
		let url: &str = system.string().get("P2P_SERVER")
			.map(String::as_str)
			.unwrap_or("");
		if url.is_empty() {
			RelayMode::Default
		} else {
			let url: RelayUrl = url.parse()?;
			RelayMode::custom([url])
		}
	};
	let transport: QuicTransportConfig = QuicTransportConfig::builder()
		.max_concurrent_bidi_streams(1u32.into())
		.max_concurrent_uni_streams(0u32.into())
		.build();
	let builder: Builder = Endpoint::builder(Minimal)
		.relay_mode(relay_mode)
		.transport_config(transport)
		.alpns(vec![P2P_ALPN.to_vec()]);
	let endpoint: Endpoint = timeout(P2P_CONNECT_TIMEOUT, builder.bind()).await??;
	Ok(endpoint)
}

pub async fn host(local_port: u16) -> Result<String, Error> {
	run_start((async move || {
		if local_port == 0 {
			return Err(anyhow!("Local duel server port must not be zero"));
		}
		let mut session: MutexGuard<'static, Option<Session>> = available_session().await?;
		let mut pending: PendingEndpoint = PendingEndpoint {
			endpoint: endpoint().await?,
			committed: false,
		};
		let endpoint: &Endpoint = &pending.endpoint;
		if timeout(P2P_RELAY_TIMEOUT, endpoint.online()).await.is_err() {
			return Err(anyhow!("P2P relay connection timed out ({} seconds)", P2P_RELAY_TIMEOUT.as_secs()));
		}
		let ticket: Ticket = Ticket::new(endpoint.addr(), Uuid::new_v4().into_bytes());
		let room_code: String = ticket.encode()?;
		let info: SessionInfo = SessionInfo {
			mode: Mode::Host,
			endpoint_id: endpoint.id().to_string(),
			room_code: Some(room_code.clone()),
			local_address: SocketAddrV4::new(Ipv4Addr::LOCALHOST, local_port).to_string(),
			running: true,
		};
		let task: JoinHandle<()> = tokio::spawn(tunnel::serve_host(endpoint.clone(), local_port, ticket.token));
		*session = Some(Session { endpoint: endpoint.clone(), task, info });
		pending.committed = true;
		Ok(room_code)
	})()).await
}

pub async fn join(room_code: String) -> Result<String, Error> {
	run_start((async move || {
		let deadline: Instant = Instant::now() + P2P_JOIN_TIMEOUT;
		let ticket: Ticket = Ticket::decode(&room_code)?;
		let mut session: MutexGuard<'static, Option<Session>> = timeout_at(deadline, available_session()).await
			.with_context(|| format!("P2P join timed out waiting for the previous session ({} seconds)", P2P_JOIN_TIMEOUT.as_secs()))??;
		let listener: TcpListener = timeout_at(deadline, TcpListener::bind((Ipv4Addr::LOCALHOST, 0))).await
			.with_context(|| format!("P2P join timed out creating the local listener ({} seconds)", P2P_JOIN_TIMEOUT.as_secs()))??;
		let local_address: String = listener.local_addr()?.to_string();
		let mut pending: PendingEndpoint = PendingEndpoint {
			endpoint: timeout_at(deadline, endpoint()).await
				.with_context(|| format!("P2P join timed out initializing the endpoint ({} seconds)", P2P_JOIN_TIMEOUT.as_secs()))??,
			committed: false,
		};
		let endpoint: &Endpoint = &pending.endpoint;
		let first: tunnel::Tunnel = timeout_at(deadline, tunnel::connect(endpoint, &ticket)).await
			.with_context(|| format!("P2P join timed out connecting to the room ({} seconds)", P2P_JOIN_TIMEOUT.as_secs()))??;
		let info: SessionInfo = SessionInfo {
			mode: Mode::Join,
			endpoint_id: endpoint.id().to_string(),
			room_code: None,
			local_address: local_address.clone(),
			running: true,
		};
		let task: JoinHandle<()> = tokio::spawn(tunnel::serve_client(endpoint.clone(), listener, ticket, first));
		*session = Some(Session { endpoint: endpoint.clone(), task, info });
		pending.committed = true;
		Ok(local_address)
	})()).await
}

pub async fn status() -> Option<SessionInfo> {
	let session: MutexGuard<'static, Option<Session>> = SESSION.lock().await;
	session.as_ref().map(|session: &Session| -> SessionInfo {
		let mut info: SessionInfo = session.info.clone();
		info.running = !session.task.is_finished() && !session.endpoint.is_closed();
		info
	})
}

pub async fn stop() {
	cancellation().send_modify(|generation: &mut u64| {
		*generation = generation.wrapping_add(1);
	});
	let mut session: MutexGuard<'static, Option<Session>> = SESSION.lock().await;
	if let Some(current) = session.take() {
		let current: Session = current;
		current.shutdown().await;
	}
}