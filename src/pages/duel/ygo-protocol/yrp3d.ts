import { YGOProYrp3d } from 'ygopro-yrp3d-encode';
import PQueue from 'p-queue';

import Msg from './msg';
import { STOC } from './network';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import connect from '../connect';

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
		this.queue.add(async () => {
			connect.duel.win.await = new Promise<string | void>((r) => connect.duel.win.resolve = r);
			connect.duel.win.title = mainGame.get.text(I18N_KEYS.DUEL_REPLAY_END);
			connect.duel.win.message = '';
			connect.duel.win.show = true;
			await connect.duel.win.await;
			connect.duel.win.resolve = undefined;
			await call_back.on_disconnect?.();
		});
	};
	disconnect = async () : Promise<void> => {
		this.queue.clear();
		await this.on_disconnect?.();
	};
};

const replay3d = new Replay3D();
export default replay3d;
export { Replay3D };