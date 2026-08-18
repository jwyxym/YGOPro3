use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub enum Event {
	Start,
	Progress,
	End
}

pub fn emit<S: Serialize + Clone>(app: &AppHandle, event: Event, payload: S) {
	let event: &str = match event {
		Event::Start => "started",
		Event::Progress => "progress",
		Event::End => "end"
	};
	if let Err(error) = app.emit(event, payload) {
		eprintln!("failed to emit {event}: {error}");
	}
}