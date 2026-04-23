import * as tcp from '@kuyoonjo/tauri-plugin-tcp';
import PQueue from 'p-queue';

import fs from '@/script/fs';
import Msg from './msg';
class Tcp {
	cid = 'YGOPro3';
	address = '';
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>;
	on_disconnect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>;
	cache : Msg = new Msg([]);

	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
	}) : Promise<boolean> => {
		try {
			this.on_message = call_back.on_message;
			this.on_disconnect = call_back.on_disconnect;
			this.address = address;
			await tcp.connect(this.cid, this.address);
			await call_back.on_connect?.(this.send);
		} catch (e) {
			fs.write.log(e);
			return false;
		}
		return true;
	};
	listen = async () : Promise<void> => {
		await tcp.listen((x) => {
			if (x.payload.id === this.cid && this.address) {
				if (x.payload.event.disconnect === this.address) {
					this.clear();
				} else if (x.payload.event.message) {
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
		await tcp.disconnect(this.cid);
		this.clear();
	};
	clear = () : void => {
		const on_disconnect = this.on_disconnect;
		this.queue.add(async () => await on_disconnect?.(this.send));
		this.address = '';
		this.cache = new Msg([]);
		this.on_message = undefined;
		this.on_disconnect = undefined;
	};
};

const _Tcp = new Tcp();
_Tcp.listen();
export default _Tcp;
export { Tcp };