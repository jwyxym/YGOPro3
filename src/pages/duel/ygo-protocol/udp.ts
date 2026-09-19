import * as udp from '@jwyxym/tauri-plugin-kcp';

import Msg from './msg';
import Socket from './socket';

class Udp extends Socket {
	cid = 'YGOPro3';
	address = '';

	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) : Promise<boolean> => await super.connect(address, call_back, async (i : string) => {
		
		this.address = i.slice(6);
		await udp.connect(this.cid, this.address);
	});

	listen = async () : Promise<void> => {
		await udp.listen((x) => {
			if (x.payload.id === this.cid && this.address) {
				switch (x.payload.event) {
					case 'data':
						const msg = new Msg(x.payload.data);
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
						break;
					case 'closed':
						this.clear();
						break;
				}
			}
		});
	};

	send = async (msg : Msg) => await udp.send(this.cid, msg.array());

	disconnect = async () : Promise<void> => {
		super.disconnect();
		try {
			await udp.close(this.cid);
		} catch {};
	};

	clear = () : void => {
		const on_disconnect = this.on_disconnect;
		this.address = '';
		this.queue.add(async () => await on_disconnect?.());
	};
};

const _Udp = new Udp();
await _Udp.listen();
export default _Udp;
export { Udp };