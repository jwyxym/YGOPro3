import * as tcp from '@kuyoonjo/tauri-plugin-tcp';

import Msg from './msg';
import Socket from './socket';

class Tcp extends Socket {
	cid = 'YGOPro3';
	address = '';
	cache : Msg = new Msg([]);

	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) : Promise<boolean> => await super.connect(address, call_back, async (i : string) => {
		this.cache = new Msg([]);
		this.address = i;
		await tcp.connect(this.cid, i);
	});

	listen = async () : Promise<void> => {
		await tcp.listen((x) => {
			if (x.payload.id === this.cid && this.address) {
				if (x.payload.event.disconnect === this.address)
					this.clear();
				else if (x.payload.event.message) {
					const msg = this.cache.concat(x.payload.event.message.data);
					while (true) {
						const len = msg.read.uint16();
						if (!len) break;
						const m = msg.slice(len);
						if (!m) {
							msg.index -= 2;
							break;
						}
						this.queue.add(
							async () => await this.on_message?.(m, this.send)
						);
					}
					this.cache = msg.to_end();
				}
			}
		});
	};

	send = async (msg : Msg) => await tcp.send(this.cid, msg.buffer());

	disconnect = async () : Promise<void> => {
		super.disconnect();
		try {
			await tcp.disconnect(this.cid);
		} catch {};
	};

	clear = () : void => {
		const on_disconnect = this.on_disconnect;
		this.queue.add(async () => await on_disconnect?.());
	};
};

const _Tcp = new Tcp();
await _Tcp.listen();
export default _Tcp;
export { Tcp };