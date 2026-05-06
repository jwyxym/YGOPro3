import WebSocket, { Message } from '@tauri-apps/plugin-websocket';
import PQueue from 'p-queue';

import mainGame from '@/script/game';
import Msg from './msg';

class Ws {
	ws ?: WebSocket;
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	on_disconnect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
	}) : Promise<boolean> => {
		try {
			if (this.ws)
				return false;
			this.ws = await WebSocket.connect(address);
			this.on_disconnect = call_back.on_disconnect;
			await call_back.on_connect?.(this.send);
			this.ws.addListener((i : Message) => {
				switch (i.type) {
					case 'Binary':
						const msg = new Msg(i.data);
						while (true) {
							const len = msg.read.uint16();
							if (!len) break;
							const m = msg.slice(len);
							if (!m) {
								msg.index -= 2;
								break;
							}
							this.queue.add(
								async () => await call_back.on_message?.(m, this.send)
							);
						}
						break;
					case 'Close': 
						this.queue.add(
							async () => await this.on_disconnect?.(this.send)
						);
				};
			});
		} catch (e) {
			mainGame.log.write(e);
			return false;
		}
		return true;
	};
	send = async (msg : Msg) => this.ws?.send(msg.array());
	disconnect = async () => {
		try {
			await this.ws?.disconnect();
		} catch {};
		this.on_disconnect?.(this.send);
		this.queue.clear();
		this.ws = undefined;
	};
};

const ws = new Ws();
export default ws;
export { Ws };