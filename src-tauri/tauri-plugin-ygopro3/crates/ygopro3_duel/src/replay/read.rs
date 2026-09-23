use std::io::{Cursor, Read, Chain};

use anyhow::{Result, Error, anyhow};
use binrw::{BinRead, BinWrite};
use ygopro_data::data::{Replay, ReplayData, ReplayDeck, ReplayHeader, ReplayHeaderFlags, ReplayVersion};

const MAX_BODY_SIZE: usize = 64 * 1024 * 1024;

pub fn read(bytes: &[u8]) -> Result<(Replay, Cursor<Vec<u8>>), Error> {
	let mut reader: Cursor<&[u8]> = Cursor::new(bytes);
	let mut header: ReplayHeader = ReplayHeader::read_le(&mut reader)
		.map_err(|error| anyhow!("invalid YRP header: {error}"))?;
	if header.id != ReplayVersion::V1 as u32 && header.id != ReplayVersion::V2 as u32 {
		return Err(anyhow!("unsupported replay magic: {:#010x}", header.id));
	}
	if header.is_tag() { return Err(anyhow!("tag replay is not supported")); }
	if header.is_single_mode() { return Err(anyhow!("single-mode replay is not supported")); }

	let raw: &[u8] = &bytes[reader.position() as usize..];
	if header.data_size as usize > MAX_BODY_SIZE {
		return Err(anyhow!("YRP body exceeds size limit"));
	}
	// Decode only the declared YRP body. Any bytes appended after the LZMA
	// stream are not inputs to ocgcore and are not needed for reconstruction.
	let body: Vec<u8> = if header.is_compressed() {
		let mut compressed: Chain<Cursor<&[u8]>, Cursor<&[u8]>> = Cursor::new(&header.props[..5]).chain(Cursor::new(raw));
		let mut body: Vec<u8> = Vec::new();
		lzma_rs::lzma_decompress_with_options(&mut compressed, &mut body, &lzma_rs::decompress::Options {
			unpacked_size: lzma_rs::decompress::UnpackedSize::UseProvided(Some(header.data_size as u64)),
			memlimit: Some(MAX_BODY_SIZE),
			allow_incomplete: false,
		}).map_err(|error| anyhow!("invalid compressed YRP body: {error}"))?;
		body
	} else {
		// Unfinished/uncompressed replays can leave data_size at zero.
		let size: usize = if header.data_size == 0 { raw.len() } else { header.data_size as usize };
		if size > MAX_BODY_SIZE { return Err(anyhow!("YRP body exceeds size limit")); }
		raw.get(..size)
			.ok_or(anyhow!("truncated YRP body"))?.to_vec()
	};
	if (header.is_compressed() || header.data_size != 0) && body.len() != header.data_size as usize {
		return Err(anyhow!("YRP body size mismatch"));
	}
	// Read only the initial state now. Response buffers are decoded later,
	// one at a time, when ocgcore requests them; trailing data is never scanned.
	let mut responses: Cursor<Vec<u8>> = Cursor::new(body);
	let _initial: (
		ygopro_data::string::FixedLengthString<20>,
		ygopro_data::string::FixedLengthString<20>,
		u32, u32, u32, u32, ReplayDeck, ReplayDeck,
	) = BinRead::read_le(&mut responses)
		.map_err(|error| anyhow!("invalid YRP initial state: {error}"))?;
	let response_start: usize = responses.position() as usize;
	header.flag.remove(ReplayHeaderFlags::Compressed);
	header.data_size = response_start as u32;
	let mut normalized: Cursor<Vec<u8>> = Cursor::new(Vec::new());
	header.write_le(&mut normalized)?;
	normalized.get_mut().extend_from_slice(&responses.get_ref()[..response_start]);
	normalized.set_position(0);
	let replay: Replay = Replay::read_le(&mut normalized)
		.map_err(|error| anyhow!("invalid YRP initial state: {error}"))?;
	Ok((replay, responses))
}

pub fn next_response(responses: &mut Cursor<Vec<u8>>) -> Result<Option<ReplayData>, Error> {
	if responses.position() as usize == responses.get_ref().len() {
		return Ok(None);
	}
	let response: ReplayData = ReplayData::read_le(responses)
		.map_err(|error| anyhow!("invalid YRP response buffer: {error}"))?;
	if response.data.len() > 64 {
		return Err(anyhow!("YRP response buffer exceeds 64 bytes"));
	}
	Ok(Some(response))
}