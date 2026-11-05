use anyhow::{Result, bail};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use iroh::EndpointAddr;
use serde::{Deserialize, Serialize};

const PREFIX: &str = "ygopro3-p2p://";
const MAX_CODE_LENGTH: usize = 8192;

#[derive(Clone, Serialize, Deserialize)]
pub struct Ticket {
	pub address: EndpointAddr,
	pub token: [u8; 16],
}

impl Ticket {
	pub fn new(address: EndpointAddr, token: [u8; 16]) -> Self {
		Self { address, token }
	}

	pub fn encode(&self) -> Result<String> {
		let bytes: Vec<u8> = serde_json::to_vec(self)?;
		let code: String = format!("{}{}", PREFIX, URL_SAFE_NO_PAD.encode(bytes));
		if code.len() > MAX_CODE_LENGTH {
			bail!("P2P room code is too long");
		}
		Ok(code)
	}

	pub fn decode(code: &str) -> Result<Self> {
		let code: String = format!("{}{}", PREFIX, code.trim());
		if code.len() > MAX_CODE_LENGTH {
			bail!("P2P room code is too long");
		}
		let code: &str = code.strip_prefix(PREFIX)
			.ok_or_else(|| anyhow::anyhow!("Invalid P2P room code version"))?;
		let code: Vec<u8> = URL_SAFE_NO_PAD.decode(code)?;
		let ticket: Self = serde_json::from_slice(&code)?;
		if ticket.address.addrs.is_empty() || ticket.address.addrs.len() > 32 {
			bail!("Invalid P2P endpoint addresses");
		}
		Ok(ticket)
	}
}