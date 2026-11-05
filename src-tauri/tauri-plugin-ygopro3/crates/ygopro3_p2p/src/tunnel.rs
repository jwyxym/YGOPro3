use anyhow::{Context, Error, bail};
use iroh::{Endpoint, endpoint::{Connection, Incoming, RecvStream, SendStream}};
use std::{net::{Ipv4Addr, SocketAddr}, time::Duration};
use tokio::{
	io::{AsyncWriteExt, copy},
	net::{TcpListener, TcpStream, tcp::{OwnedReadHalf, OwnedWriteHalf}},
	task::JoinSet,
	time::timeout
};

use super::{ALPN, CONNECT_TIMEOUT, JOIN_TIMEOUT, ticket::Ticket};

const HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(10);
const LOCAL_CONNECT_TIMEOUT: Duration = Duration::from_secs(60);
const MAX_CONNECTIONS: usize = 32;

struct Peer {
	connection: Connection,
}

impl Drop for Peer {
	fn drop(&mut self) {
		self.connection.close(0u32.into(), b"P2P tunnel closed");
	}
}

pub struct Tunnel {
	_peer: Peer,
	send: SendStream,
	recv: RecvStream,
}

impl Tunnel {
	async fn forward(mut self, socket: TcpStream) -> Result<(), Error> {
		socket.set_nodelay(true)?;
		let (mut reader, mut writer): (OwnedReadHalf, OwnedWriteHalf) = socket.into_split();
		tokio::try_join!(
			async {
				let _: u64 = copy(&mut reader, &mut self.send).await?;
				self.send.finish()?;
				let _ = self.send.stopped().await?;
				Ok::<(), Error>(())
			},
			async {
				let _: u64 = copy(&mut self.recv, &mut writer).await?;
				writer.shutdown().await?;
				Ok::<(), Error>(())
			}
		)?;
		Ok(())
	}
}

pub async fn connect(endpoint: &Endpoint, ticket: &Ticket) -> Result<Tunnel, Error> {
	timeout(JOIN_TIMEOUT, async {
		let connection: Connection = endpoint.connect(ticket.address.clone(), ALPN).await?;
		let peer: Peer = Peer { connection };
		let (mut send, mut recv): (SendStream, RecvStream) = peer.connection.open_bi().await?;
		send.write_all(&ticket.token).await?;
		let mut accepted: [u8; 1] = [0];
		recv.read_exact(&mut accepted).await?;
		if accepted != [1] {
			bail!("P2P room rejected the connection");
		}
		Ok(Tunnel { _peer: peer, send, recv })
	}).await.context("P2P connection and room handshake timed out (8 seconds)")?
}

async fn serve_peer(incoming: Incoming, local_port: u16, token: [u8; 16]) -> Result<(), Error> {
	let connection: Connection = timeout(CONNECT_TIMEOUT, async { incoming.await }).await??;
	let peer: Peer = Peer { connection };
	let (send, recv, socket): (SendStream, RecvStream, TcpStream) = timeout(
		HANDSHAKE_TIMEOUT,
		async {
			let (mut send, mut recv): (SendStream, RecvStream) = peer.connection.accept_bi().await?;
			let mut supplied: [u8; 16] = [0; 16];
			recv.read_exact(&mut supplied).await?;
			let mismatch: u8 = supplied.iter().zip(token.iter())
				.fold(0, |difference: u8, (left, right): (&u8, &u8)| -> u8 {
					difference | (*left ^ *right)
				});
			if mismatch != 0 {
				bail!("Invalid P2P room credential");
			}
			let socket: TcpStream = TcpStream::connect((Ipv4Addr::LOCALHOST, local_port)).await?;
			send.write_all(&[1]).await?;
			Ok::<(SendStream, RecvStream, TcpStream), Error>((send, recv, socket))
		}
	).await??;
	Tunnel { _peer: peer, send, recv }.forward(socket).await
}

fn log_error(error: Error) {
	let _ = ygopro3_log::log::write(format!("P2P tunnel: {:#}", error));
}

pub async fn serve_host(endpoint: Endpoint, local_port: u16, token: [u8; 16]) {
	let mut clients: JoinSet<()> = JoinSet::new();
	loop {
		tokio::select! {
			incoming = endpoint.accept() => {
				let Some(incoming) = incoming else { break; };
				let incoming: Incoming = incoming;
				if clients.len() >= MAX_CONNECTIONS {
					incoming.refuse();
					continue;
				}
				clients.spawn(async move {
					if let Err(error) = serve_peer(incoming, local_port, token).await {
						let error: Error = error;
						log_error(error);
					}
				});
			}
			Some(_) = clients.join_next(), if !clients.is_empty() => {}
		}
	}
	clients.shutdown().await;
}

pub async fn serve_client(endpoint: Endpoint, listener: TcpListener, ticket: Ticket, first: Tunnel) {
	let mut first: Option<Tunnel> = Some(first);
	loop {
		let accepted: Result<(TcpStream, SocketAddr), Error> = if first.is_some() {
			match timeout(LOCAL_CONNECT_TIMEOUT, listener.accept()).await {
				Ok(result) => result.map_err(Error::from),
				Err(error) => Err(Error::from(error)),
			}
		} else {
			listener.accept().await.map_err(Error::from)
		};
		let (socket, _address): (TcpStream, SocketAddr) = match accepted {
			Ok(accepted) => accepted,
			Err(error) => {
				log_error(error);
				break;
			}
		};
		let tunnel: Tunnel = match first.take() {
			Some(tunnel) => tunnel,
			None => match connect(&endpoint, &ticket).await {
				Ok(tunnel) => tunnel,
				Err(error) => {
					log_error(error);
					continue;
				}
			},
		};
		if let Err(error) = tunnel.forward(socket).await {
			log_error(error);
		}
	}
}