import lodash from 'lodash';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { KEYS } from '@/script/constant';

import { toast } from '@/pages/toast/toast';

import Msg from './msg';
import { ERROR, STOC, MSG, HINT, LOCATION, CTOS, PLAYERCHANGE, QUERY, COMMAND, POS } from './network';

import connect from '../connect';
import { duel } from '../scene/scene';
import { chat, ChatMsg } from '../log/chat';
import { HISTORY, history } from '../log/history/history';
import Client_Card from '../scene/client_card';

const SERVER = mainGame.get.text(I18N_KEYS.SERVER);

type Protocol_Func = (msg : Msg, send : (msg : Msg) => Promise<void>) => Promise<void> | ((msg : Msg) => Promise<void>) | (() => Promise<void>);

class Protocol {
	event : string;
	current_msg : number;
	select_hint : number;
	last_select_hint : number;
	turn_player : number;
	need_update : boolean;
	constructor () {
		this.event = '';
		this.current_msg = 0;
		this.select_hint = 0;
		this.last_select_hint = 0;
		this.turn_player = 0;
		this.need_update = false;
	};
	server_msg = (str : string) => new ChatMsg(SERVER, str, '');
	hint = (msg : ChatMsg | string, player ?: number, players : Array<{
		name : string;
		status : boolean;
		avatar : string;
	}> = connect.wait.players) => {
		msg = msg instanceof ChatMsg ? msg : player ? new ChatMsg(players[player].name, msg, players[player].avatar) : this.server_msg(msg);
		if (!connect.chat.show)
			toast.info(connect.wait.players.find(i => i.name === msg.name) ? msg.name + (msg.name.length > 0 ? ': ' : '') : '' + msg.msg);
		chat.push(msg);
	};
	error = (msg : ChatMsg | string) => {
		msg = msg instanceof ChatMsg ? msg : this.server_msg(msg);
		if (!connect.chat.show)
			toast.info(SERVER + ': ' + msg.msg);
		chat.push(msg);
	};
	to = {
		player : (player : number) : number => {
			player = player > 0 ? 1 : 0;
			return connect.duel.is_first ? player : 1 - player;
		}
	};
	get = {
		card : (tp : number, loc : number, seq : number) : Client_Card | undefined => {
			const cards = duel.get.cards()
				.filter(i => i.owner === tp && (i.location & loc) && i.seq === seq);
			return cards.length > 1 ? lodash.maxBy(cards, i => i.overlay) : cards[0];
		}
	};
	update = {
		card : (msg : Msg, card : Client_Card) : Array<[Client_Card | undefined, number]> | void => {
			const flag = msg.read.uint32();
			const result : Array<[Client_Card | undefined, number]> = [];
			if (!flag)
				return card.clear.self();
			if (flag & QUERY.CODE) {
				const code = msg.read.uint32();
				if (!code)
					return card.clear.self();
				result.push([card, code]);
			}
			if (flag & QUERY.POSITION) {
				const pdata = msg.read.uint32();
				if (pdata === undefined) return;
				const pos = (pdata >> 24) & 0xff;
				if((card.pos & (LOCATION.EXTRA | LOCATION.REMOVED))
					&& card.pos !== pos)
						card.set.pos(pos);
			}
			if (flag & QUERY.ALIAS) {
				const alias = msg.read.uint32();
				if (alias === undefined) return;
				card.set.alias(alias);
				result.push([undefined, alias]);
			}
			if (flag & QUERY.TYPE)
				card.set.type(msg.read.uint32() ?? 0);
			if (flag & QUERY.LEVEL) {
				const lv = msg.read.uint32();
				if (lv === undefined) return;
				card.set.level(lv);
			}
			if (flag & QUERY.RANK) {
				const rank = msg.read.uint32();
				if (rank === undefined) return;
				card.set.rank(rank);
			}
			if (flag & QUERY.ATTRIBUTE)
				card.set.attribute(msg.read.uint32() ?? 0);
			if (flag & QUERY.RACE)
				card.set.race(msg.read.uint32() ?? 0);
			if (flag & QUERY.ATTACK)
				card.set.atk(msg.read.uint32() ?? 0);
			if (flag & QUERY.DEFENSE)
				card.set.def(msg.read.uint32() ?? 0);
			if (flag & QUERY.BASE_ATTACK)
				msg.index ++;
			if (flag & QUERY.BASE_DEFENSE)
				msg.index ++;
			if (flag & QUERY.REASON)
				msg.index ++;
			if (flag & QUERY.REASON_CARD)
				msg.index += 4;
			if (flag & QUERY.EQUIP_CARD)
				msg.index += 4;
			if (flag & QUERY.TARGET_CARD) {
				const len = msg.read.uint32();
				msg.index += 4 * (len ?? 0);
			}
			if (flag & QUERY.OVERLAY_CARD) {
				const ct = msg.read.uint32();
				if (ct === undefined) return;
				card.set.overlay(ct);
				const cards = duel.get.cards()
					.filter(i => (i.location & (card.location & LOCATION.OVERLAY))
						&& i.owner === card.owner
						&& i.seq === card.seq
					);
				for (let i = 0; i < ct; i ++) {
					const c = cards[i];
					const code = msg.read.uint32();
					if (!c || code === undefined) return;
					result.push([c, code]);
				}
			}
			if (flag & QUERY.COUNTERS) {
				const ct = msg.read.uint32() ?? 0;
				for (let i = 0; i < ct; i ++) {
					const ctype = msg.read.uint16();
					const ccount = msg.read.uint16();
					if (ctype === undefined || ccount === undefined) return;
					card.set.counter(ctype, ccount, false);
				}
			}
			if (flag & QUERY.OWNER) {
				const tp = msg.read.uint32();
				if (tp === undefined) return;
				card.set.owner(tp);
			}
			if (flag & QUERY.STATUS)
				msg.index += 4;
			if (flag & QUERY.LSCALE) {
				const scale = msg.read.uint32();
				if (scale === undefined) return;
				card.set.scale(scale);
			}
			if (flag & QUERY.RSCALE)
				msg.index += 4;
			if (flag & QUERY.LINK) {
				const link = msg.read.uint32();
				if (link === undefined) return;
				card.set.link(link);
			}
			return result;
		}
	}
	read = async (msg : Msg, send : (msg : Msg) => Promise<void>) : Promise<void> => {
		const protocol = msg.read.uint8()!;
		if (protocol === undefined)
			return;
		await this.stoc.get(protocol)?.(msg, send);
	};
	stoc = new Map<number, Protocol_Func>([
		[STOC.GAME_MSG, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			const protocol = msg.read.uint8();
			if (protocol === undefined)
				return;
			this.current_msg = protocol;
			if ([MSG.UPDATE_DATA, MSG.UPDATE_CARD]
				.includes(protocol))
				this.need_update = true;
			else if (this.need_update) {
				await duel.update();
				this.need_update = false;
			}
			console.log(this.current_msg)
			await this.msg.get(protocol)?.(msg, send);
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
					connect.wait.deck.result?.(str);
					this.error(str);
					break;
			}
		}],
		[STOC.SELECT_HAND,async () => {
			connect.duel.rps.show = true;
		}],
		[STOC.SELECT_TP, async (_, send : (msg : Msg) => Promise<void>) => {
			connect.duel.rps.show = false;
			connect.duel.select.option.array = [
				I18N_KEYS.SERVER_PLAYER_FIRST,
				I18N_KEYS.SERVER_PLAYER_NEXT
			].map(i => mainGame.get.text(i));
			connect.duel.select.option.title = mainGame.get.text(I18N_KEYS.SERVER_PLAYER_SELECT);
			connect.response = async (v : number) => {
				await send(new Msg()
					.write.uint8(CTOS.TP_RESULT)
					.write.uint8(1 - v)
				);
				connect.duel.select.option.show = false;
			}
			connect.duel.select.option.show = true;
		return;
		}],
		[STOC.HAND_RESULT,async (msg : Msg) => {
			const res = [msg.read.uint8(), msg.read.uint8()];
			if (res[0] === undefined || res[1] === undefined)
				return;
			let key : number;
			if (res[0] === res[1])
				key = I18N_KEYS.SERVER_RPS_BYE;
			else {
				if (res[0] === res[1] + 1 || res[0] === res[1] - 2) {
					key = I18N_KEYS.SERVER_RPS_WIN;
					await (this.stoc.get(STOC.SELECT_TP) as () => Promise<void> | undefined)?.();
				} else
					key = I18N_KEYS.SERVER_RPS_LOSE;
				connect.duel.rps.show = false;
			}
			this.hint(mainGame.get.text(key));
		}],
		[STOC.DECK_COUNT,async (msg : Msg) => {
			const self_main = msg.read.uint16() ?? 0;
			const self_ex = msg.read.uint16() ?? 0;
			const self_side = msg.read.uint16() ?? 0;
			const oppo_main = msg.read.uint16() ?? 0;
			const oppo_ex = msg.read.uint16() ?? 0;
			const oppo_side = msg.read.uint16() ?? 0;
			this.hint(mainGame.get.text(I18N_KEYS.DUEL_DECK_COUNT,
				[mainGame.get.text(I18N_KEYS.DUEL_PLAYER_SELF), self_main, self_ex, self_side]
			));
			this.hint(mainGame.get.text(I18N_KEYS.DUEL_DECK_COUNT,
				[mainGame.get.text(I18N_KEYS.DUEL_PLAYER_OPPO), oppo_main, oppo_ex, oppo_side]
			));
			history.push(HISTORY.DECK_COUNT, {
				self : true,
				cards : [],
				number : `${self_main} - ${self_ex} - ${self_side}`
			});
			history.push(HISTORY.DECK_COUNT, {
				self : false,
				cards : [],
				number : `${oppo_main} - ${oppo_ex} - ${oppo_side}`
			});
		}],
		[STOC.JOIN_GAME,async (msg : Msg) => {
			connect.wait.info.lflist = msg.read.uint8() ?? 0;
			connect.wait.info.rule = msg.read.uint8() ?? 0;
			connect.wait.info.mode = msg.read.uint8() ?? 0;
			connect.wait.info.duel_rule = msg.read.uint8() ?? 0;
			connect.wait.info.no_check_deck = (msg.read.uint8() ?? 1) === 0;
			connect.wait.info.no_shuffle_deck = (msg.read.uint8() ?? 1) === 0;
			msg.index += 3;
			connect.wait.info.start_lp = msg.read.uint32() ?? 8000;
			connect.wait.info.start_hand = msg.read.uint8() ?? 5;
			connect.wait.info.draw_count = msg.read.uint8() ?? 1;
			connect.wait.info.time_limit = msg.read.uint8() ?? 240;
			connect.state = 1;
		}],
		[STOC.TYPE_CHANGE,async (msg : Msg) => {
			const type = msg.read.uint8();
			if (type === undefined) return;
			connect.wait.self.is_host = !!((type >> 4) & 0xf);
			connect.wait.self.position = (type & 0xf) as 0 | 1 | 2 | 3;
		}],
		[STOC.DUEL_START,async () => {
			connect.state = 2;
		}],
		[STOC.TIME_LIMIT,async (msg : Msg, send : (msg: Msg) => Promise<void>) => {
			const player = msg.read.uint8();
			msg.index ++;
			const time = msg.read.uint16();
			if (player === undefined || time === undefined)
				return;
			// connect.time.to(player, time);
			if(this.to.player(player) === 0)
				await send(new Msg()
					.write.uint8(CTOS.TIME_CONFIRM));
		}],
		[STOC.CHAT,async (msg : Msg) => {
			const player = msg.read.uint16();
			const str = msg.read.str(msg.length() - msg.index);
			if (player === undefined || str === undefined)
				return;
			const players = connect.state < 2 || connect.duel.is_first ? connect.wait.players
				: connect.wait.info.mode & 2 ? [connect.wait.players[2],
					connect.wait.players[3],
					connect.wait.players[0],
					connect.wait.players[1]
				] : [connect.wait.players[1], connect.wait.players[0]];
			if (player < 4) {
				if (mainGame.get.system(KEYS.SETTING_CHK_HIDDEN_CHAT))
					return;
				if (connect.wait.players[connect.wait.self.position] !== players[player])
					this.hint(str, player, players);
				else chat.push(new ChatMsg(players[player].name, str, players[player].avatar, true));
			}
			else if (player === 9)
				this.error(`[Script Error]: ${str}`);
			else if ((player < 11 || player > 19) && player !== 8)
				this.hint(new ChatMsg(mainGame.get.text(I18N_KEYS.SERVER_WATCHER), str, ''));
			else this.hint(str);
		}],
		[STOC.HS_PLAYER_ENTER,async (msg : Msg) => {
			const name = msg.read.str(40);
			const player = msg.read.uint8();
			if (player === undefined || name === undefined)
				return;
			connect.wait.players[player].name = mainGame.get.system(KEYS.SETTING_CHK_HIDDEN_NAME)
				&& connect.wait.self.position !== player ? mainGame.get.text(I18N_KEYS.HIDDEN_NAME)
				: name;
		}],
		[STOC.HS_PLAYER_CHANGE,async (msg : Msg) => {
			const ct = msg.read.uint8();
			if (ct === undefined) return;
			const state = ct & 0xf;
			const player = (ct >> 4) & 0xf;
			switch (state) {
				case PLAYERCHANGE.OBSERVE:
					connect.wait.players[player].name = '';
					connect.wait.players[player].status = false;
					connect.wait.info.watch ++;
					break;
				case PLAYERCHANGE.READY:
					connect.wait.players[player].status = true;
					connect.wait.deck.result?.(true);
					break;
				case PLAYERCHANGE.NOTREADY:
					connect.wait.players[player].status = false;
					break;
				case PLAYERCHANGE.LEAVE:
					connect.wait.players[player].name = '';
					connect.wait.players[player].status = false;
					break;
				default:
					if (state < 4) {
						connect.wait.players[state].name = connect.wait.players[player].name;
						connect.wait.players[state].status = connect.wait.players[player].status;
						connect.wait.players[player].name = '';
						connect.wait.players[player].status = false;
					}
					break;
			}
		}],
		[STOC.HS_WATCH_CHANGE,async (msg : Msg) => {
			connect.wait.info.watch = msg.read.uint16() ?? 0;
		}],
		[STOC.TEAMMATE_SURRENDER,async () => {
			const str = mainGame.get.strings.system(1355);
			this.hint(str);
		}]
	]);
	msg = new Map<number, Protocol_Func>([
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
		[MSG.UPDATE_DATA, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			const location = msg.read.uint8();
			if (location === undefined)
				return;
			let codes : Array<[Client_Card | undefined, number]> = [];
			if (location & LOCATION.ONFIELD) {
				const ct = location === LOCATION.MZONE ? 7 : 8;
				for (let seq = 0; seq < ct; seq ++) {
					const card = this.get.card(tp, location, seq);
					const len = msg.read.uint32();
					if (len === undefined) break;
					const index = msg.index + len - 4;
					if (len > 8 && card) {
						const code = this.update.card(msg, card);
						if (code)
							codes = codes.concat(code);
					}
					msg.index = index;
				}
			} else {
				const cards = duel.get.cards()
					.filter(i => i.owner === tp && (i.location & location));
				for (const card of cards) {
					const len = msg.read.uint32();
					if (len === undefined) break;
					const index = msg.index + len - 4;
					if (len > 8 && card) {
						const code = this.update.card(msg, card);
						if (code)
							codes = codes.concat(code);
					}
					msg.index = index;
				}
			}
			await mainGame.load.pic(codes.map(i => i[1]));
			codes.forEach(i => i[0]?.set.id(i[1]));
		}],
		[MSG.UPDATE_CARD, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			const loc = msg.read.uint8();
			const seq = msg.read.uint8();
			const len = msg.read.uint32();
			if (loc === undefined || seq === undefined || len === undefined)
				return;
			const card = this.get.card(tp, loc, seq);
			if (card && len > 8) {
				const codes = this.update.card(msg, card);
				if (codes) {
					await mainGame.load.pic(codes.map(i => i[1]));
					codes.forEach(i => i[0]?.set.id(i[1]));
				}
			}
		}],
		[MSG.SELECT_BATTLECMD, async (msg : Msg) => {
			msg.index ++;
			duel.clear.activate();
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.uint32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const desc = msg.read.uint32();
				if (code === undefined || loc === undefined || seq === undefined || desc === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card) {
					card.set.activate(COMMAND.ACTIVATE, i, desc);
					codes.push([card, code]);
				}
			}
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				msg.index += 4;
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				msg.index ++;
				if (loc === undefined || seq === undefined)
					return;
				this.get.card(tp, loc, seq)?.set.activate(COMMAND.ATTACK, i);
			}
			await mainGame.load.pic(codes.map(i => i[1]));
			codes.forEach(i => i[0].set.id(i[1]));
			const m2 = msg.read.uint8();
			const ep = msg.read.uint8();
			await duel.update();
		}],
		[MSG.DRAW, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			const ct = msg.read.uint8();
			if (ct === undefined)
				return;
			this.event = mainGame.get.strings.system(1611 + tp, ct);
			const cards = duel.draw(tp, ct);
			const codes : Array<number> = new Array(ct)
				.map(_ => msg.read.uint32())
				.filter(i => i !== undefined);
			if (!tp) {
				await mainGame.load.pic(codes);
				for (let i = 0; i < ct; i ++) {
					const code = codes[i];
					const card = cards[i];
					if (card && code)
						card.set.id(code);
				}
			}
			history.push(HISTORY.DRAW, {
				self : !tp,
				cards : codes.map(i => {return { id : i, pos : POS.FACEUP_ATTACK }; }),
				avatar : mainGame.get.avatar(tp)
			});
			await duel.update();
		}],
	]);
};

export default Protocol;