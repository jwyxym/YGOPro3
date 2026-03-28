import WebSocket, { Message } from '@tauri-apps/plugin-websocket';
import PQueue from 'p-queue';

import fs from '@/script/fs';
import Msg from './msg';

class Ws {
	ws ?: WebSocket;
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
	}) : Promise<boolean> => {
		try {
			if (this.ws)
				return false;
			this.ws = await WebSocket.connect(address);
			await call_back.on_connect?.(this.send);
			this.ws.addListener((i : Message) => {
				switch (i.type) {
					case 'Binary':
						const msg = new Msg(i.data);
						msg.read.uint16();
						this.queue.add(
							async () => await call_back.on_message?.(msg, this.send)
						);
						break;
					case 'Close': 
						this.queue.add(
							async () => await call_back.on_disconnect?.(this.send)
						);
				};
			});
		} catch (e) {
			fs.write.log(e);
			return false;
		}
		return true;
	};
	send = async (msg : Msg) => this.ws?.send(msg.array());
	disconnect = async () => {
		await this.ws?.disconnect();
		this.ws = undefined;
	};
};

const ws = new Ws();
export default ws;
export { Ws };