import PQueue from 'p-queue';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import Msg from './msg';
import { ERROR, STOC } from './network';
import connect from '../connect';

class Protocol {
	current_msg ?: number;
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	read = async (msg : Msg) => {
		const protocol = msg.read.uint8()!;
		if (!protocol)
			return;
		await this.stoc.get(protocol)?.(msg);
	};
	stoc = new Map<number, (msg : Msg) => Promise<void>>([
		[STOC.GAME_MSG, async (msg : Msg) => {
			const protocol = msg.read.uint8()!;
			if (!protocol)
				return;
			this.queue.add(
				async () => {
					msg.read.uint16();
					this.current_msg = msg.read.uint8();
					msg.index -= 3;
					await this.msg.get(protocol)?.(msg);
				}
			);
		}],
		[STOC.ERROR_MSG, async (msg : Msg) => {
			const protocol = msg.read.uint8();
			msg.index += 3;
			const code = msg.read.uint32();
			if (!protocol || !code)
				return;
			switch (protocol) {
				case ERROR.DECKERROR:
					const flag = code >> 28;
					const id = code & mainGame.max_card_id;
					let str;
					switch (flag) {
						case ERROR.LFLIST:
							str = mainGame.get.strings.system(1407, mainGame.get.name(id));
							break;
						case ERROR.OCGONLY:
							str = mainGame.get.strings.system(1413, mainGame.get.name(id));
							break;
						case ERROR.TCGONLY:
							str = mainGame.get.strings.system(1414, mainGame.get.name(id));
							break;
						case ERROR.UNKNOWNCARD:
							str = mainGame.get.strings.system(1415, [mainGame.get.name(id), id]);
							break;
						case ERROR.CARDCOUNT:
							str = mainGame.get.strings.system(1416,mainGame.get.name(id));
							break;
						case ERROR.MAINCOUNT:
							str = mainGame.get.strings.system(1417, id);
							break;
						case ERROR.EXTRACOUNT:
							str = mainGame.get.strings.system(id > 0 ? 1418 : 1420, mainGame.get.name(id));
							break;
						case ERROR.SIDECOUNT:
							str = mainGame.get.strings.system(1419, id);
							break;
						default:
							str = mainGame.get.text(I18N_KEYS.UNKNOW);
							break;
					}
					break;
			}
		}],
	]);
	msg = new Map<number, (msg : Msg) => Promise<void>>([

	]);
};

export default Protocol;