import * as udp from '@jwyxym/tauri-plugin-kcp';

import Msg from './msg';
import Socket from './socket';
import { CTOS, STOC } from './network';

class Udp extends Socket {
	on_heartbeat_end ?: () => void;
	cid = 'YGOPro3';
	address = '';
	closing = {
		task : undefined as Promise<void> | undefined,
		confirm : undefined as (() => void) | undefined,
	};

	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) : Promise<boolean> => {
		if (this.closing.task) await this.closing.task;
		if (this.address) await this.disconnect();
		return await super.connect(address, call_back, async (i : string) => {
		
		this.on_heartbeat_end?.();
		this.address = i.slice(6);
		await udp.connect(this.cid, this.address);
		});
	};

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
							// 退出确认不等待动画队列，也不再次发送退出请求。
							if (m.content[0] === STOC.LEAVE_GAME) {
								void this.disconnect(true);
								continue;
							}
							if (this.closing.task) continue;
							if (m.content[0] === STOC.PING || m.content[0] === STOC.PONG) {
								void this.on_message?.(m, this.send).catch(() => this.disconnect());
								continue;
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

	disconnect = async (confirmed : boolean = false) : Promise<void> => {
		if (confirmed) this.closing.confirm?.();
		if (this.closing.task) return await this.closing.task;
		this.on_heartbeat_end?.();
		super.disconnect();
		const cid = this.cid;
		const task = (async () => {
			let timer : ReturnType<typeof setTimeout> | undefined;
			try {
				if (!confirmed && this.address) {
					const acknowledgement = new Promise<void>(resolve => {
						this.closing.confirm = resolve;
						timer = setTimeout(resolve, 3000);
					});
					const confirm = this.closing.confirm;
					void udp.send(cid, new Msg().write.uint8(CTOS.LEAVE_GAME).array()).catch(() => confirm?.());
					await acknowledgement;
				}
			} finally {
				clearTimeout(timer);
				this.closing.confirm = undefined;
				try { await udp.close(cid); } catch {};
				this.clear();
			}
		})();
		this.closing.task = task;
		try { await task; } finally {
			if (this.closing.task === task) this.closing.task = undefined;
		}
	};

	clear = () : void => {
		this.closing.confirm?.();
		if (!this.address) return;
		this.on_heartbeat_end?.();
		const on_disconnect = this.on_disconnect;
		this.address = '';
		this.queue.add(async () => await on_disconnect?.());
	};
};

const _Udp = new Udp();
await _Udp.listen();
export default _Udp;
export { Udp };