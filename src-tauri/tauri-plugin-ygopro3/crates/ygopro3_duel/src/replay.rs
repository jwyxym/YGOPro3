use std::{
	io::Cursor,
	ops::Deref,
	time::Duration
};
use anyhow::{Result, Error, anyhow};
use binrw::BinRead;
use futures::{FutureExt, Stream as FuturesStream};
use tokio::{
	select,
	sync::mpsc::{UnboundedSender, unbounded_channel},
	time::sleep,
};
use tokio_stream::{StreamExt, wrappers::UnboundedReceiverStream};
use ygopru::{
	ygopro::{
		Configuration,
		DuelHost,
		PRO_VERSION,
		plugin::no_init_shuffle_deck::NAME as NO_INIT_SHUFFLE_DECK,
	},
	ygopro_core_wrapper::DuelSeed,
	ygopro_data::{
		complex::Complex,
		constants::{
			CorePlayer,
			CorePlayer::{FirstAttackPlayer, SecondAttackPlayer},
			Hand::{Paper, Rock},
		},
		data::Replay,
		message::gm::GameMessage,
		message::{
			ctos::{
				HandResult,
				HsReady,
				HsStart,
				JoinGame,
				Message as CtosMessage,
				PlayerInfo,
				Response,
				TimeConfirm,
				TpResult,
				UpdateDeck,
			},
			stoc::{
				Message as StocMessage,
				Message::{GameMessage as StocGameMessage, TimeLimit},
				MessageType,
				MessageType::{
					HsPlayerChange,
					HsPlayerEnter,
					SelectHand,
					SelectTp,
					TypeChange,
				},
			},
		},
		string::FixedLengthString,
	},
	ygopro_handler::RoomProvider,
};

const RESPONSE_TIMEOUT: Duration = Duration::from_secs(30);
const DRAIN_TIMEOUT: Duration = Duration::from_millis(100);
const YRP3D_SIBYL_NAME: u8 = 235;
const YRP3D_NAME_FIELD_CHARS: usize = 50;

pub async fn collect_messages (yrp: Vec<u8>) -> Result<Vec<u8>, Error> {
	super::init().await?;

	let replay: Replay = Replay::read_le(&mut Cursor::new(yrp))?;
	if replay.is_tag() {
		return Err(anyhow!("tag replay is not supported"));
	}

	let seed_sequence: [u32; 8] = replay.header.seed_sequence;
	let mut configuration: Configuration = Configuration::default();
	configuration.no_mask = true;
	configuration.enable_plugin(NO_INIT_SHUFFLE_DECK);
	configuration.seed_generator = Some(Box::new(move |_| DuelSeed::Complicated(seed_sequence)));

	let mut messages: Vec<Vec<u8>> = Vec::new();
	let mut host: DuelHost = DuelHost::new(replay.host_info(), configuration);
	let (mut player1, mut player2) = start_duel(&replay, &mut host, &mut messages).await?;

	for data in &replay.body.datas {
		let response: Response = Response {
			response: data.data.clone(),
		};

		loop {
			select! {
				message = player1.stoc_stream.next() => {
					let message = message.ok_or_else(|| anyhow!("player1 disconnected"))?;
					collect_game_message(&mut messages, &message);
					if should_respond(&player1.ctos_sender, FirstAttackPlayer, &message)? {
						player1.ctos_sender.send(response.into())?;
						break;
					}
				}
				message = player2.stoc_stream.next() => {
					let message = message.ok_or_else(|| anyhow!("player2 disconnected"))?;
					if should_respond(&player2.ctos_sender, SecondAttackPlayer, &message)? {
						player2.ctos_sender.send(response.into())?;
						break;
					}
				}
				_ = sleep(RESPONSE_TIMEOUT) => {
					return Err(anyhow!("timed out while replaying response"));
				}
			}
		}
	}

	drain_messages(&mut player1, &mut player2, &mut messages).await?;
	write_yrp3d(&replay, messages)
}

fn write_yrp3d (replay: &Replay, messages: Vec<Vec<u8>>) -> Result<Vec<u8>, Error> {
	let name_payload: Vec<u8> = write_yrp3d_name_payload(replay);
	let has_start_message: bool = messages
		.iter()
		.any(|message: &Vec<u8>| message.first() == Some(&4));
	let mut wrote_name: bool = false;
	let mut out: Vec<u8> = Vec::new();
	if !has_start_message {
		write_yrp3d_packet(&mut out, YRP3D_SIBYL_NAME, &name_payload)?;
		wrote_name = true;
	}
	for message in messages {
		let Some((&packet_type, payload)) = message.split_first() else {
			continue;
		};
		write_yrp3d_packet(&mut out, packet_type, payload)?;
		if !wrote_name && packet_type == 4 {
			write_yrp3d_packet(&mut out, YRP3D_SIBYL_NAME, &name_payload)?;
			wrote_name = true;
		}
	}
	Ok(out)
}

fn write_yrp3d_packet (out: &mut Vec<u8>, packet_type: u8, payload: &[u8]) -> Result<(), Error> {
	if payload.len() > u32::MAX as usize {
		return Err(anyhow!("yrp3d packet payload is too large"));
	}
	out.push(packet_type);
	out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
	out.extend_from_slice(payload);
	Ok(())
}

fn write_yrp3d_name_payload (replay: &Replay) -> Vec<u8> {
	let mut payload: Vec<u8> = Vec::with_capacity(YRP3D_NAME_FIELD_CHARS * 2 * 6 + 4);
	write_yrp3d_name_field(&mut payload, &replay.body.host_name);
	write_yrp3d_name_field(&mut payload, "");
	write_yrp3d_name_field(&mut payload, &replay.body.host_name);
	write_yrp3d_name_field(&mut payload, &replay.body.client_name);
	write_yrp3d_name_field(&mut payload, "");
	write_yrp3d_name_field(&mut payload, &replay.body.client_name);
	payload.extend_from_slice(&(replay.duel_rule() as i32).to_le_bytes());
	payload
}

fn write_yrp3d_name_field (out: &mut Vec<u8>, value: &str) {
	let mut len: usize = 0;
	for code in value.encode_utf16().take(YRP3D_NAME_FIELD_CHARS) {
		out.extend_from_slice(&code.to_le_bytes());
		len += 1;
	}
	for _ in len..YRP3D_NAME_FIELD_CHARS {
		out.extend_from_slice(&0u16.to_le_bytes());
	}
}

struct Player<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> {
	ctos_sender: UnboundedSender<CtosMessage>,
	stoc_stream: Room::ServerToClientStream,
}

fn create_player<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> (
	room: &mut Room,
) -> Player<Room> {
	let (ctos_sender, ctos_receiver) = unbounded_channel();
	let stoc_stream = room.add(UnboundedReceiverStream::new(ctos_receiver));
	Player {
		ctos_sender,
		stoc_stream,
	}
}

async fn start_duel<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> (
	replay: &Replay,
	room: &mut Room,
	messages: &mut Vec<Vec<u8>>,
) -> Result<(Player<Room>, Player<Room>)> {
	let mut player1 = create_player(room);
	send(
		&player1.ctos_sender,
		PlayerInfo {
			name: replay.body.host_name.clone(),
		}
		.into(),
	)?;
	send(
		&player1.ctos_sender,
		JoinGame {
			version: *PRO_VERSION,
			gameid: 0,
			pass: FixedLengthString::allocate(),
		}
		.into(),
	)?;
	wait_for(
		&mut player1.stoc_stream,
		TypeChange,
		Some(messages),
	)
	.await?;

	let mut player2 = create_player(room);
	send(
		&player2.ctos_sender,
		PlayerInfo {
			name: replay.body.client_name.clone(),
		}
		.into(),
	)?;
	send(
		&player2.ctos_sender,
		JoinGame {
			version: *PRO_VERSION,
			gameid: 0,
			pass: FixedLengthString::allocate(),
		}
		.into(),
	)?;
	wait_for(
		&mut player2.stoc_stream,
		TypeChange,
		None,
	)
	.await?;

	wait_for(
		&mut player1.stoc_stream,
		HsPlayerEnter,
		Some(messages),
	)
	.await?;

	send(
		&player1.ctos_sender,
		UpdateDeck {
			deck: replay.body.host_deck.clone().into(),
		}
		.into(),
	)?;
	send(&player1.ctos_sender, HsReady.into())?;
	send(
		&player2.ctos_sender,
		UpdateDeck {
			deck: replay.body.client_deck.clone().into(),
		}
		.into(),
	)?;
	send(&player2.ctos_sender, HsReady.into())?;
	wait_for(
		&mut player2.stoc_stream,
		HsPlayerChange,
		None,
	)
	.await?;

	send(&player1.ctos_sender, HsStart.into())?;
	wait_for(
		&mut player1.stoc_stream,
		SelectHand,
		Some(messages),
	)
	.await?;

	send(
		&player1.ctos_sender,
		HandResult { res: Paper }.into(),
	)?;
	send(
		&player2.ctos_sender,
		HandResult { res: Rock }.into(),
	)?;
	wait_for(
		&mut player1.stoc_stream,
		SelectTp,
		Some(messages),
	)
	.await?;

	send(
		&player1.ctos_sender,
		TpResult {
			result: FirstAttackPlayer,
		}
		.into(),
	)?;

	Ok((player1, player2))
}

async fn wait_for<DuelStream> (
	stream: &mut DuelStream,
	message_type: MessageType,
	mut collector: Option<&mut Vec<Vec<u8>>>,
) -> Result<()>
where
	DuelStream: FuturesStream<Item = Complex<StocMessage>> + Unpin,
{
	while let Some(message) = stream.next().await {
		if let Some(messages) = collector.as_deref_mut() {
			collect_game_message(messages, &message);
		}
		if MessageType::from(message.deref()) == message_type {
			return Ok(());
		}
	}
	Err(anyhow!("stream ended while waiting for {message_type:?}"))
}

fn should_respond (
	ctos_sender: &UnboundedSender<CtosMessage>,
	player: CorePlayer,
	message: &Complex<StocMessage>,
) -> Result<bool> {
	match message.deref() {
		TimeLimit(limit) if limit.player == player => {
			ctos_sender.send(TimeConfirm.into())?;
		}
		StocGameMessage(game_message)
			if game_message.message.waiting_for().is_some() =>
		{
			return Ok(true);
		}
		_ => {}
	}
	Ok(false)
}

fn collect_game_message (messages: &mut Vec<Vec<u8>>, message: &Complex<StocMessage>) {
	if let StocGameMessage(_) = message.deref()
		&& message.data.len() > 1
	{
		messages.push(message.data[1..].to_vec());
	}
}

async fn drain_messages<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> (
	player1: &mut Player<Room>,
	player2: &mut Player<Room>,
	messages: &mut Vec<Vec<u8>>,
) -> Result<()> {
	loop {
		select! {
			message = player1.stoc_stream.next() => {
				let Some(message) = message else { return Ok(()); };
				collect_game_message(messages, &message);
				if should_respond(&player1.ctos_sender, FirstAttackPlayer, &message)? {
					return Ok(());
				}
			}
			message = player2.stoc_stream.next() => {
				let Some(message) = message else { return Ok(()); };
				if should_respond(&player2.ctos_sender, SecondAttackPlayer, &message)? {
					return Ok(());
				}
			}
			_ = sleep(DRAIN_TIMEOUT).fuse() => {
				return Ok(());
			}
		}
	}
}

fn send (sender: &UnboundedSender<CtosMessage>, message: CtosMessage) -> Result<()> {
	sender.send(message)?;
	Ok(())
}
