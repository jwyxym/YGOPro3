import dg from '@/script/dglab';

import connect from '@/pages/duel/connect';

import { MSG } from './network';
import Msg from './msg';

class Extend {
	to = {
		player : (player : number) : 0 | 1 => {
			player = player > 0 ? 1 : 0;
			return (connect.duel.is_first ? player : 1 - player) as 0 | 1 ;
		}
	};

	private content = new Map<number, (msg : Msg) => Promise<void>>([
		[MSG.DAMAGE, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			if (tp) return;
			const val = msg.read.int32();
			if (!val)
				return;
			await dg.happen(val);
		}]
	]);

	constructor () {
		this.content.set(MSG.PAY_LPCOST, this.content.get(MSG.DAMAGE)!);
	};

	get = (i : number) => this.content.get(i);
};

const extend = new Extend();

export default extend;