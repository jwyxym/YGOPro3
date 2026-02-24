use serde::{Serialize, Deserialize};
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ServerINI {
	#[serde(alias = "YGOMobileAddServer")]
	ygomobile_add_server: ServerINIContent
}
#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ServerINIContent {
	#[serde(alias = "ServerName")]
	server_name: String,
	#[serde(alias = "ServerHost")]
	server_host: String,
	#[serde(alias = "ServerPort")]
	server_port: Option<u16>
}

impl ServerINI {
	pub fn host (&self) -> String {
		match self.ygomobile_add_server.server_port {
			Some(port) => format!("{}:{}", self.ygomobile_add_server.server_host, port),
			None => self.ygomobile_add_server.server_host.clone()
		}
	}

	pub fn name (&self) -> String {
		self.ygomobile_add_server.server_name.clone()
	}
}