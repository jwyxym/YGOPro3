use ygopro3_const::{CONFIG, P2P_MAX_CODE_LENGTH, P2P_PREFIX};

use anyhow::{Result, Error, anyhow};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use bincode::serde::{decode_from_slice, encode_to_vec};
use iroh::EndpointAddr;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct Ticket {
	pub address: EndpointAddr,
	pub token: [u8; 16],
}

impl Ticket {
	pub fn new(address: EndpointAddr, token: [u8; 16]) -> Self {
		Self { address, token }
	}

	pub fn encode(&self) -> Result<String, Error> {
		let bytes: Vec<u8> = encode_to_vec(self, CONFIG)?;
		let code: String = format!("{}{}", P2P_PREFIX, URL_SAFE_NO_PAD.encode(bytes));
		if code.len() > P2P_MAX_CODE_LENGTH {
			return Err(anyhow!("P2P room code is too long"));
		}
		Ok(code)
	}

	pub fn decode(code: &str) -> Result<Self, Error> {
		let code: &str = code.trim();
		if code.len() > P2P_MAX_CODE_LENGTH {
			return Err(anyhow!("P2P room code is too long"));
		}
		let code: &str = code.strip_prefix(P2P_PREFIX)
			.ok_or_else(|| anyhow!("Invalid P2P room code prefix"))?;
		let code: Vec<u8> = URL_SAFE_NO_PAD.decode(code)?;
		let (ticket, consumed): (Self, usize) = decode_from_slice(
			&code,
			CONFIG.with_limit::<P2P_MAX_CODE_LENGTH>()
		)?;
		if consumed != code.len() {
			return Err(anyhow!("Invalid P2P room code trailing data"));
		}
		if ticket.address.addrs.is_empty() || ticket.address.addrs.len() > 32 {
			return Err(anyhow!("Invalid P2P endpoint addresses"));
		}
		Ok(ticket)
	}
}