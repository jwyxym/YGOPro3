use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub fn emit<S: Serialize + Clone>(app: &AppHandle, event: &str, payload: S) {
	if let Err(error) = app.emit(event, payload) {
		eprintln!("failed to emit {event}: {error}");
	}
}