import { connect, WebSocket, type Message } from '@/script/websocket';

import Msg from './msg';
import Socket from './socket';

class Ws extends Socket {
	ws ?: WebSocket;

	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) : Promise<boolean> => await super.connect(address, call_back, async (ad : string) => {
		if (this.ws)
			throw Error('webscoket is connected');
		this.ws = await connect(ad, (i : Message) => {
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
						async () => await this.on_disconnect?.()
					);
			};
		});
	});

	send = async (msg : Msg) => this.ws?.send(msg.array());

	disconnect = async () => {
		super.disconnect();
		try {
			await this.ws?.disconnect();
		} catch {};
		this.ws = undefined;
	};
};

const ws = new Ws();
export default ws;
export { Ws };