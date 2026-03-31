import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';

import { toast } from '@/pages/toast/toast';

import Msg from './msg';
import { ERROR, STOC, MSG, HINT, LOCATION } from './network';

import connect from '../connect';
import { duel } from '../scene/scene';
import { chat, ChatMsg } from '../log/chat';

class Protocol {
	event : string;
	current_msg : number;
	select_hint : number;
	last_select_hint : number;
	turn_player : number;
	constructor () {
		this.event = '';
		this.current_msg = 0;
		this.select_hint = 0;
		this.last_select_hint = 0;
		this.turn_player = 0;
	};
	hint = (msg : ChatMsg | string, player ?: number) => {
		msg = msg instanceof ChatMsg ? msg : new ChatMsg(connect.wait.players[player!].name, msg, connect.wait.players[player!].avatar);
		toast.info(msg.name + (msg.name.length > 0 ? ':' : '') + msg.msg, true);
		chat.push(msg);
	};
	error = (msg : ChatMsg | string) => {
		msg = msg instanceof ChatMsg ? msg : new ChatMsg('SERVER', msg, '');
		toast.info('SERVE :' + msg.msg, true);
		chat.push(msg);
	};
	to = {
		player : (player : number) : number => {
			player = player > 0 ? 1 : 0;
			return connect.duel.is_first ? player : 1 - player;
		}
	};
	read = async (msg : Msg, send : (msg : Msg) => Promise<void>) : Promise<void> => {
		const protocol = msg.read.uint8()!;
		if (protocol === undefined)
			return;
		await this.stoc.get(protocol)?.(msg, send);
	};
	stoc = new Map<number, (msg : Msg, send ?: (msg : Msg) => Promise<void>) => Promise<void>>([
		[STOC.GAME_MSG, async (msg : Msg, send ?: (msg : Msg) => Promise<void>) => {
			const protocol = msg.read.uint8();
			if (protocol === undefined)
				return;
			this.current_msg = protocol;
			await this.msg.get(protocol)?.(msg, send!);
		}],
		[STOC.ERROR_MSG, async (msg : Msg) => {
			const protocol = msg.read.uint8();
			msg.index += 3;
			const code = msg.read.uint32();
			if (protocol === undefined || code === undefined)
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
					connect.wait.deck.result?.(str)
					break;
			}
		}],
	]);
	msg = new Map<number, (msg : Msg, send : (msg : Msg) => Promise<void>) => Promise<void>>([
		[MSG.RETRY, async (msg : Msg) => {

		}],
		[MSG.HINT, async (msg : Msg) => {
			const type = msg.read.uint8();
			const player = this.to.player(msg.read.uint8() ?? 0);
			const content = msg.read.uint32();
			if (type === undefined || content === undefined)
				return;
			switch (type) {
				case HINT.EVENT:
					this.event = mainGame.get.desc(content);
					break;
				case HINT.MESSAGE:
					this.hint(mainGame.get.desc(content));
					break;
				case HINT.SELECTMSG:
					this.select_hint = content;
					this.last_select_hint = content;
					break;
				case HINT.OPSELECTED:
					this.hint(mainGame.get.strings.system(1510, mainGame.get.desc(content)), player);
					break;
				case HINT.EFFECT:
					break;
				case HINT.RACE:
					this.hint(mainGame.get.strings.system(1511, mainGame.get.strings.race(content)), player);
					break;
				case HINT.ATTRIB:
					this.hint(mainGame.get.strings.system(1511, mainGame.get.strings.attribute(content)), player);
					break;
				case HINT.CODE:
					this.hint(mainGame.get.strings.system(1511, mainGame.get.name(content)), player);
					break;
				case HINT.NUMBER:
					this.hint(mainGame.get.strings.system(1512, content), player);
					break;
				case HINT.CARD:
					break;
				case HINT.ZONE:
					break;
				case HINT.DIALOG:
					this.hint(mainGame.get.desc(content), player);
					break;
			}
		}],
		[MSG.START, async (msg : Msg) => {
			const playertype = msg.read.uint8();
			if (playertype === undefined)
				return;
			msg.index += 1;
			connect.duel.is_first =  (playertype & 0xf) === 0;
			connect.duel.lp[0] = msg.read.uint32() ?? 0;
			connect.duel.lp[1] = msg.read.uint32() ?? 0;
			const decks = [[msg.read.uint16() ?? 0, msg.read.uint16() ?? 0], [msg.read.uint16() ?? 0, msg.read.uint16() ?? 0]];
			this.select_hint = 0;
			this.last_select_hint = 0;
			const loc = [LOCATION.DECK, LOCATION.EXTRA];
			decks.forEach((i, tp) => {
				for (let v = 0; v < loc.length; v ++)
					for (let seq = 0; seq < i[v]; seq ++)
						duel.add.card(tp, loc[v], seq);
			})
		}],
		[MSG.WIN, async (msg : Msg) => {
			const player = msg.read.uint8();
			const type = msg.read.uint8();
			if (player === undefined ||type === undefined)
				return;
			const key = player === 2 ? I18N_KEYS.DUEL_GAME : this.to.player(player) === 0 ? I18N_KEYS.DUEL_WIN : I18N_KEYS.DUEL_LOSE;
			const message = mainGame.get.strings.victory(type);
			duel.win(mainGame.get.text(key), message);
		}],
	]);
};

export default Protocol;