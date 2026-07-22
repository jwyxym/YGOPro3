
import { Channel, invoke } from '@tauri-apps/api/core';
import WebSocket, { Message } from '@tauri-apps/plugin-websocket';

const connect = async (
	url : string,
	listener : (message: Message) => void
) : Promise<WebSocket> => {
	const listeners : Set<(arg : Message) => void> = new Set();
	listeners.add(listener);
	const on = new Channel<Message>();
	on.onmessage = (message : Message) : void => listeners.forEach((l) => l(message));

	return new WebSocket(
		await invoke<number>('plugin:websocket|connect', {
			url : url,
			onMessage : on
		}),
		listeners
	);
}

export { connect };