mod read;

use std::{
	io::Cursor,
	ops::Deref,
	time::Duration
};
use anyhow::{Result, Error, anyhow};
use binrw::BinWrite;
use futures::Stream as FuturesStream;
use tokio::{
	select,
	sync::mpsc::{UnboundedSender, unbounded_channel},
	time::{timeout, Instant, sleep_until},
};
use tokio_stream::{StreamExt, wrappers::UnboundedReceiverStream};
use ygopro_core_wrapper::DuelSeed;
use ygopro_handler::RoomProvider;
use ygopro::{
	Configuration,
	DuelHost,
	PRO_VERSION,
	plugin::no_init_shuffle_deck::NAME as NO_INIT_SHUFFLE_DECK,
};
use ygopro_data::{
	complex::Complex,
	constants::{
		CorePlayer,
		CorePlayer::{FirstAttackPlayer, SecondAttackPlayer},
		Hand::{Paper, Rock},
	},
	data::{forge, Replay, ReplayHeader, ReplayVersion, DuelOptions},
	message::gm::{self, GameMessage},
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
};

const RESPONSE_TIMEOUT: Duration = Duration::from_secs(30);

pub async fn collect_messages (yrp: Vec<u8>) -> Result<Vec<u8>, Error> {
	let (replay, mut responses) = read::read(&yrp)?;
	validate_replay(&replay)?;
	let seed = replay_seed(&replay.header)?;
	super::init().await?;

	let mut configuration: Configuration = Configuration::default();
	configuration.no_mask = true;
	configuration.enable_plugin(NO_INIT_SHUFFLE_DECK);
	configuration.seed_generator = Some(Box::new(move |_| seed.clone()));

	let mut messages: Vec<Complex<StocMessage>> = Vec::new();
	let mut host: DuelHost = DuelHost::new(replay.host_info(), configuration);
	let (mut player1, mut player2, mut observer) = timeout(
		RESPONSE_TIMEOUT, start_duel(&replay, &mut host, &mut messages),
	).await.map_err(|error| anyhow!("timed out starting replay: {error}"))??;
	drive_replay(&mut responses, &mut player1, &mut player2, &mut observer, &mut messages).await?;
	write_yrp3d(messages)
}

fn replay_seed(header: &ReplayHeader) -> Result<DuelSeed> {
	match header.id {
		id if id == ReplayVersion::V1 as u32 => Ok(DuelSeed::Single(header.seed)),
		id if id == ReplayVersion::V2 as u32 => Ok(DuelSeed::Complicated(header.seed_sequence)),
		id => return Err(anyhow!("unsupported replay magic: {id:#010x}")),
	}
}

fn validate_replay(replay: &Replay) -> Result<()> {
	if replay.is_tag() { return Err(anyhow!("tag replay is not supported")); }
	let supported = DuelOptions::PseudoShuffle | DuelOptions::ObsoleteRuling;
	if replay.body.duel_options.bits() & !supported.bits() != 0 {
		return Err(anyhow!("unsupported replay duel options: {:?}", replay.body.duel_options));
	}
	Ok(())
}

fn write_yrp3d (recorded: Vec<Complex<StocMessage>>) -> Result<Vec<u8>, Error> {
	let replay: forge::Replay = forge::Replay {
		messages: ygopro_data::message::stoc_to_forge(&recorded),
	};
	let mut writer: Cursor<Vec<u8>> = Cursor::new(Vec::new());
	replay.write_le(&mut writer).map_err(|error| anyhow!("failed to encode YRP3D: {error}"))?;
	Ok(writer.into_inner())
}

struct Player<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> {
	ctos_sender: UnboundedSender<CtosMessage>,
	stoc_stream: Room::ServerToClientStream,
}

fn create_player<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> (
	room: &mut Room,
) -> Player<Room> {
	let (ctos_sender, ctos_receiver) = unbounded_channel();
	let stoc_stream: <Room as RoomProvider<CtosMessage, Complex<StocMessage>>>::ServerToClientStream = room.add(UnboundedReceiverStream::new(ctos_receiver));
	Player {
		ctos_sender,
		stoc_stream,
	}
}

async fn start_duel<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> (
	replay: &Replay,
	room: &mut Room,
	messages: &mut Vec<Complex<StocMessage>>,
) -> Result<(Player<Room>, Player<Room>, Player<Room>)> {
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
		None,
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
		None,
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

	let mut observer = create_player(room);
	send(&observer.ctos_sender, PlayerInfo { name: FixedLengthString::allocate() }.into())?;
	send(&observer.ctos_sender, JoinGame {
		version: *PRO_VERSION, gameid: 0, pass: FixedLengthString::allocate(),
	}.into())?;
	wait_for(&mut observer.stoc_stream, TypeChange, Some(messages)).await?;

	send(&player1.ctos_sender, HsStart.into())?;
	wait_for(
		&mut player1.stoc_stream,
		SelectHand,
		None,
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
		None,
	)
	.await?;

	send(
		&player1.ctos_sender,
		TpResult {
			result: FirstAttackPlayer,
		}
		.into(),
	)?;

	Ok((player1, player2, observer))
}

async fn wait_for<DuelStream> (
	stream: &mut DuelStream,
	message_type: MessageType,
	mut collector: Option<&mut Vec<Complex<StocMessage>>>,
) -> Result<()>
where
	DuelStream: FuturesStream<Item = Complex<StocMessage>> + Unpin,
{
	while let Some(message) = stream.next().await {
		if let Some(messages) = collector.as_deref_mut() {
			messages.push(message.clone());
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
		StocGameMessage(game_message) if matches!(game_message.message, gm::Message::Retry(_)) => {
			return Err(anyhow!("replay desynced: engine rejected the recorded response"));
		}
		TimeLimit(limit) if limit.player == player => {
			ctos_sender.send(TimeConfirm.into())?;
		}
		StocGameMessage(game_message)
			if game_message.message.waiting_for() == Some(player) =>
		{
			return Ok(true);
		}
		_ => {}
	}
	Ok(false)
}

async fn drive_replay<Room: RoomProvider<CtosMessage, Complex<StocMessage>>> (
	responses: &mut Cursor<Vec<u8>>,
	player1: &mut Player<Room>,
	player2: &mut Player<Room>,
	observer: &mut Player<Room>,
	messages: &mut Vec<Complex<StocMessage>>,
) -> Result<()> {
	let mut response_index: usize = 0;
	let mut deadline: Instant = Instant::now() + RESPONSE_TIMEOUT;
	loop {
		let (sender, player, message) = select! {
			biased;
			_ = sleep_until(deadline) => return Err(anyhow!("replay timed out after {response_index} responses")),
			message = observer.stoc_stream.next() => {
				let message = message.ok_or(anyhow!("replay observer disconnected before completion"))?;
				messages.push(message.clone());
				if let StocGameMessage(game) = message.deref()
					&& let gm::Message::Win(_) = &game.message
				{
					return Ok(());
				}
				continue;
			}
			message = player1.stoc_stream.next() => {
				let message = message.ok_or(anyhow!("replay player1 disconnected before completion"))?;
				(&player1.ctos_sender, FirstAttackPlayer, message)
			}
			message = player2.stoc_stream.next() => {
				let message = message.ok_or(anyhow!("replay player2 disconnected before completion"))?;
				(&player2.ctos_sender, SecondAttackPlayer, message)
			}
		};
		let respond: bool = should_respond(sender, player, &message)
			.map_err(|error: Error| anyhow!("after {response_index} replay responses: {error:#}"))?;
		if respond {
			let Some(data) = read::next_response(responses)
				.map_err(|error: Error| anyhow!("reading replay response {response_index}: {error:#}"))?
			else { return Ok(()); };
			sender.send(Response { response: data.data }.into())?;
			response_index += 1;
			deadline = Instant::now() + RESPONSE_TIMEOUT;
		}
	}
}

fn send (sender: &UnboundedSender<CtosMessage>, message: CtosMessage) -> Result<()> {
	sender.send(message)?;
	Ok(())
}
