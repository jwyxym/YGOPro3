import Msg from '@/pages/duel/ygo-protocol/msg';
import Socket from '@/pages/duel/ygo-protocol/socket';

class Ws extends Socket {
	ws ?: WebSocket;
	kind : 'ws' = 'ws';

	connect = async (address : string, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) : Promise<boolean> => await super.connect(address, call_back, async (ad : string | Uint8Array) => {
		ad = ad as string;
		if (this.ws)
			throw Error('webscoket is connected');
		this.ws = new WebSocket(ad);
		this.ws.binaryType = 'arraybuffer';
		this.ws.onopen = () => this.queue.start();
		this.ws.onmessage = (i : MessageEvent<ArrayBuffer>) => {
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
		};
		this.ws.onclose = () => this.queue.add(
			async () => {
				await this.on_disconnect?.();
				this.ws = undefined;
			}
		);
	});

	send = async (msg : Msg) => this.ws?.send(msg.buffer().buffer as ArrayBuffer);

	disconnect = async () => {
		super.disconnect();
		try {
			this.ws?.close();
		} catch {};
	};
};

const ws = new Ws();
export default ws;
export { Ws };