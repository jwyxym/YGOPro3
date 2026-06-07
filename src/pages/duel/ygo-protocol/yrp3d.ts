import { YGOProYrp3d } from 'ygopro-yrp3d-encode';
import PQueue from 'p-queue';

import Msg from './msg';
import { STOC } from './network';

class Replay3D {
	yrp3d = new YGOProYrp3d();
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	on_disconnect ?: () => Promise<void>;
	on = async (bytes : Uint8Array, call_back : {
		on_connect ?: (name : [string, string], duel_rule : number) => Promise<void>
		on_message ?: (messgae : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>
		on_disconnect ?: () => Promise<void>
	}) => {
		const replay = this.yrp3d.fromYrp3d(bytes);
		this.on_disconnect = call_back.on_disconnect;
		await call_back.on_connect?.([replay.name0, replay.name1], replay.masterRule);
		for (const packet of replay.messages) {
			const m = new Msg([STOC.GAME_MSG]).concat(packet.toPayload());
			this.queue.add(
				async () => await call_back.on_message?.(m, async () => {})
			);
		}
		this.queue.add(
			call_back.on_disconnect ?? Promise.resolve
		);
	};
	disconnect = async () => {
		this.queue.clear();
		await this.on_disconnect?.();
	};
};

const replay3d = new Replay3D();
export default replay3d;
export { Replay3D };