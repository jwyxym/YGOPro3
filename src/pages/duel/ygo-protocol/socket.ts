import PQueue from 'p-queue';

import invoke from '@/script/invoke';
import Msg from './msg';

abstract class Socket {
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: false
	});
	on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>;
	on_disconnect ?: () => Promise<void>;

	abstract kind : 'tcp' | 'udp' | 'ws' | 'replay';

	abstract send : (msg : Msg) => Promise<void>;

	async connect (address : string | Uint8Array, call_back : {
		on_connect ?: (send : (msg : Msg) => Promise<void>) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}, connect ?: (address : string | Uint8Array) => Promise<void>) : Promise<boolean> {
		try {
			this.on_message = call_back.on_message;
			this.on_disconnect = async () => {
				await call_back.on_disconnect?.();
				this.queue.pause();
			};
			this.queue.clear();
			this.queue.add(
				async () => await call_back.on_connect?.(this.send)
			);
			await connect?.(address);
			this.queue.start();
		} catch (e) {
			await invoke.log.write(e);
			this.queue.clear();
			return false;
		}
		return true;
	};

	async disconnect (_confirmed : boolean = false) : Promise<void> {
		this.queue.clear();
	};
};

export default Socket;