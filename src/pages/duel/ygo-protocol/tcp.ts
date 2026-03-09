import * as tcp from '@kuyoonjo/tauri-plugin-tcp';
import PQueue from 'p-queue';

import fs from '../../../script/fs';
import Msg from './msg';
class Tcp {
	cid = 'YGOPro3';
	address = '';
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	on_message ?: (cid : string, messgae : Msg) => Promise<void>;
	on_disconnect ?: (cid : string) => Promise<void>;
	cache : Msg = new Msg([]);

	connect = async (address : string, call_back : {
		on_connect ?: () => Promise<void>
		on_message ?: (messgae : Msg) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) : Promise<boolean> => {
		try {
			this.on_disconnect = call_back.on_disconnect;
			this.address = address;
			await tcp.connect(this.cid, this.address);
			await call_back.on_connect?.();
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
					this.queue.add(async () => await this.on_disconnect?.(this.cid));
					this.address = '';
					this.on_message = undefined;
					this.on_disconnect = undefined;
				} else if (x.payload.event.message) {
					const msg = this.cache.concat(x.payload.event.message.data);
					let len = msg.read.uint16();
					while (len && msg.length() > len + 2) {
						this.queue.add(async () => await this.on_message?.(this.cid, msg.slice(len!)!));
						len = msg.read.uint16();
					}
					msg.index -= 2;
					this.cache = msg.to_end();
				}
			}
		});
	};
	send = async (msg : Msg) => await tcp.send(this.cid, msg.buffer());
	disconnect = async () : Promise<void> => {
		await tcp.disconnect(this.cid);
		this.queue.add(async () => await this.on_disconnect?.(this.cid));
		this.address = '';
		this.on_message = undefined;
		this.on_disconnect = undefined;
	}
};

const _Tcp = new Tcp();
await _Tcp.listen();
export default _Tcp;