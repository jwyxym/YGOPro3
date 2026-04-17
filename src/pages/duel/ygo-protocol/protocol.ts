import lodash from 'lodash';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { KEYS } from '@/script/constant';
import { TYPE } from '@/script/card';

import { toast } from '@/pages/toast/toast';

import Msg from './msg';
import { ERROR, STOC, MSG, HINT, LOCATION, CTOS, PLAYERCHANGE, QUERY, COMMAND, POS, PHASE } from './network';

import connect from '../connect';
import { duel } from '../scene/scene';
import { chat, ChatMsg } from '../log/chat';
import { HISTORY, history } from '../log/history/history';
import { phase } from '../scene/phase';
import Client_Card from '../scene/client_card';
import Plaid from '../scene/plaid';

const SERVER = mainGame.get.text(I18N_KEYS.SERVER);

type Protocol_Func = (msg : Msg, send : (msg : Msg) => Promise<void>) => Promise<void> | ((msg : Msg) => Promise<void>) | (() => Promise<void>);

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

		this.msg.set(MSG.SELECT_DISFIELD, this.msg.get(MSG.SELECT_PLACE)!);
	};
	server_msg = (str : string) => new ChatMsg(SERVER, str, '');
	hint = (msg : ChatMsg | string, player ?: number, players : Array<{
		name : string;
		status : boolean;
		avatar : string;
	}> = connect.wait.players) => {
		msg = msg instanceof ChatMsg ? msg : player ? new ChatMsg(players[player].name, msg, players[player].avatar) : this.server_msg(msg);
		if (!connect.chat.show)
			toast.info((connect.wait.players.find(i => i.name === msg.name)
					? msg.name + (msg.name.length > 0 ? ': ' : '')
					: ''
				) + msg.msg
			);
		chat.push(msg);
	};
	error = (msg : ChatMsg | string) => {
		msg = msg instanceof ChatMsg ? msg : this.server_msg(msg);
		if (!connect.chat.show)
			toast.info(SERVER + ': ' + msg.msg);
		chat.push(msg);
	};
	to = {
		player : (player : number) : 0 | 1 => {
			player = player > 0 ? 1 : 0;
			return (connect.duel.is_first ? player : 1 - player) as 0 | 1 ;
		}
	};
	get = {
		card : (tp : number, loc : number, seq : number) : Client_Card | undefined => {
			const cards = duel.get.cards()
				.filter(i =>
					(i.owner === tp || tp === 2)
					&& (i.location & loc)
					&& i.seq === seq
				);
			return cards.length > 1 ? lodash.maxBy(cards, i => i.overlay) : cards[0];
		},
		overlay : (tp : number, loc : number, seq : number, ct : number) : Client_Card | undefined => {
			if (!(loc & LOCATION.OVERLAY))
				return;
			const cards = lodash.orderBy(
				duel.get.cards()
					.filter(i =>
						(i.owner === tp || tp === 2)
						&& (i.location & loc)
						&& i.seq === seq
					),
				i => i.overlay
			);
			return cards.length > ct ? cards[ct] : cards[0];
		},
		response : (i : number, command : number) : number => {
			switch (command) {
				case COMMAND.SUMMON:
					return i << 16;
				case COMMAND.SPSUMMON:
					return (i << 16) + 1;
				case COMMAND.MSET:
					return (i << 16) + 3;
				case COMMAND.SSET:
					return (i << 16) + 4;
				case COMMAND.ACTIVATE:
					return (i << 16) + 5;
				default:
					return 0;
			}
		}
	};
	update = {
		card : (msg : Msg, card : Client_Card) : Array<[Client_Card | undefined, number]> => {
			const flag = msg.read.int32();
			const result : Array<[Client_Card | undefined, number]> = [];
			if (!flag) {
				card.clear.self();
				return [];
			}
			if (flag & QUERY.CODE) {
				const code = msg.read.int32();
				if (!code) {
					card.clear.self();
					return [];
				}
				result.push([card, code]);
			}
			if (flag & QUERY.POSITION) {
				const pdata = msg.read.int32();
				if (pdata === undefined) return result;
				const pos = (pdata >> 24) & 0xff;
				if (card.location & (LOCATION.EXTRA | LOCATION.REMOVED))
					card.set.pos(pos & POS.FACEUP
						? POS.FACEUP_ATTACK
						: POS.FACEDOWN_ATTACK
					);
			}
			if (flag & QUERY.ALIAS) {
				const alias = msg.read.int32();
				if (alias === undefined) return result;
				card.set.alias(alias);
				result.push([undefined, alias]);
			}
			if (flag & QUERY.TYPE)
				card.set.type(msg.read.int32() ?? 0);
			if (flag & QUERY.LEVEL) {
				const lv = msg.read.int32();
				if (lv === undefined) return result;
				card.set.level(lv);
			}
			if (flag & QUERY.RANK) {
				const rank = msg.read.int32();
				if (rank === undefined) return result;
				card.set.rank(rank);
			}
			if (flag & QUERY.ATTRIBUTE)
				card.set.attribute(msg.read.int32() ?? 0);
			if (flag & QUERY.RACE)
				card.set.race(msg.read.int32() ?? 0);
			if (flag & QUERY.ATTACK)
				card.set.atk(msg.read.int32() ?? 0);
			if (flag & QUERY.DEFENSE)
				card.set.def(msg.read.int32() ?? 0);
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
				const len = msg.read.int32();
				msg.index += 4 * (len ?? 0);
			}
			if (flag & QUERY.OVERLAY_CARD) {
				const ct = msg.read.int32();
				if (ct === undefined) return result;
				card.set.overlay(ct);
				const cards = duel.get.cards()
					.filter(i => (i.location & card.location)
						&& i.owner === card.owner
						&& i.seq === card.seq
						&& i !== card
					);
				for (let i = 0; i < ct; i ++) {
					const c = cards[i];
					const code = msg.read.int32();
					if (!c || code === undefined) return result;
					result.push([c, code]);
					c.set.overlay(ct - (i + 1));
				}
			}
			if (flag & QUERY.COUNTERS) {
				const ct = msg.read.int32() ?? 0;
				for (let i = 0; i < ct; i ++) {
					const ctype = msg.read.uint16();
					const ccount = msg.read.uint16();
					if (ctype === undefined || ccount === undefined) return result;
					card.set.counter(ctype, ccount, false);
				}
			}
			if (flag & QUERY.OWNER) {
				const tp = msg.read.int32();
				if (tp === undefined) return result;
				card.set.owner(tp);
			}
			if (flag & QUERY.STATUS) {
				const status = msg.read.int32();
				if (status === undefined) return result;
				card.set.status(status);
			}
			if (flag & QUERY.LSCALE) {
				const scale = msg.read.int32();
				if (scale === undefined || !(card.location & LOCATION.SZONE) || card.seq) return result;
				card.set.scale(scale);
			}
			if (flag & QUERY.RSCALE) {
				const scale = msg.read.int32();
				if (scale === undefined || !(card.location & LOCATION.SZONE) || card.seq !== 4) return result;
				card.set.scale(scale);
			}
			if (flag & QUERY.LINK) {
				const link = msg.read.int32();
				if (link === undefined) return result;
				card.set.link(link);
			}
			return result;
		},
		codes : async (codes : Array<[Client_Card | undefined, number]>) : Promise<void> => {
			const load = await mainGame.load.pic(codes.map(i => i[1]));
			codes.forEach(i => i[0]?.set.id(i[1]));
			if (load)
				await duel.update(codes.map(i => i[0]).filter(i => i !== undefined));
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
			console.log(this.current_msg)
			await this.msg.get(protocol)?.(msg, send);
		}],
		[STOC.ERROR_MSG, async (msg : Msg) => {
			const protocol = msg.read.uint8();
			msg.index += 3;
			const code = msg.read.int32();
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
			if (connect.duel.player[player])
				connect.duel.player[player]!.time = time;
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
			msg.index ++;
			connect.duel.is_first = (playertype & 0xf) === 0;
			const players = (() => {
				const p = connect.wait.self.position;
				if (connect.wait.info.mode & 2) {
					const i = [
						[[2, 1], [0, 3]],
						[[3, 0], [2, 1]]
					];
					const [self, oppo] = i[Number(p > 1)][Number(connect.duel.is_first)];
					return [
						connect.wait.players[self],
						connect.wait.players[oppo]
					];
				} else
					return [
						connect.wait.players[p],
						connect.wait.players[1 - p]
					];
			})();
			connect.duel.player[0].lp = msg.read.uint32() ?? 0;
			connect.duel.player[1].lp = msg.read.uint32() ?? 0;
			connect.duel.player[0].name = players[0].name;
			connect.duel.player[1].name = players[players.length - 1].name;
			connect.duel.player[0].index = 0;
			connect.duel.player[1].index = 1;
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
						codes = codes.concat(code);
					}
					msg.index = index;
				}
			}
			await this.update.codes(codes);
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
				await this.update.codes(codes);
			}
		}],
		[MSG.SELECT_BATTLECMD, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			duel.clear.activate();
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const desc = msg.read.uint32();
				if (code === undefined || loc === undefined || seq === undefined || desc === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card) {
					card.set.activate(COMMAND.ACTIVATE, i, desc, true);
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
				this.get.card(tp, loc, seq)
					?.set.activate(COMMAND.ATTACK, i, undefined, true);
			}
			await this.update.codes(codes);
			if (msg.read.uint8())
				duel.btn?.enable.push(PHASE.MAIN2);
			if (msg.read.uint8())
				duel.btn?.enable.push(PHASE.END);
			duel.get.cards().forEach(i => i.btnable = true);
			await duel.update();
			connect.response = async (i : number, command : number)=> {
				await send(
					new Msg()
						.write.uint8(CTOS.RESPONSE)
						.write.uint32(this.get.response(i, command))
				);
				duel.clear.activate();
			};
		}],
		[MSG.SELECT_IDLECMD, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			duel.clear.activate();
			const codes : Array<[Client_Card, number]> = [];
			const commands = [COMMAND.SUMMON, COMMAND.SPSUMMON, COMMAND.REPOS, COMMAND.MSET, COMMAND.SSET, COMMAND.ACTIVATE];
			for (const command of commands) {
				const ct = msg.read.uint8() ?? 0;
				for (let i = 0; i < ct; i ++) {
					if (command === COMMAND.ACTIVATE) {
						const code = msg.read.int32();
						const tp = this.to.player(msg.read.uint8() ?? 0);
						const loc = msg.read.uint8();
						const seq = msg.read.uint8();
						const desc = msg.read.int32();
						if (code === undefined
							|| loc === undefined
							|| seq === undefined
							|| desc === undefined
						)
							return;
						const card = this.get.card(tp, loc, seq);
						if (card) {
							codes.push([card, code]);
							card.set.activate(command, i, desc, true);
						}
					} else {
						const code = msg.read.int32();
						const tp = this.to.player(msg.read.uint8() ?? 0);
						const loc = msg.read.uint8();
						const seq = msg.read.uint8();
						if (code === undefined
							|| loc === undefined
							|| seq === undefined
						)
							return;
						const card = this.get.card(tp, loc, seq);
						if (card) {
							codes.push([card, code]);
							card.set.activate(command, i, undefined, true);
						}
					}
				}
			}
			await this.update.codes(codes);
			if (msg.read.uint8())
				duel.btn?.enable.push(PHASE.MAIN2);
			if (msg.read.uint8())
				duel.btn?.enable.push(PHASE.END);
			connect.duel.shuffle = !!msg.read.uint8();
			duel.get.cards().forEach(i => i.btnable = true);
			await duel.update();
			connect.response = async (i : number, command : number) => {
				await send(
					new Msg()
						.write.uint8(CTOS.RESPONSE)
						.write.uint32(this.get.response(i, command))
				);
				duel.clear.activate();
			};
		}],
		[MSG.SELECT_EFFECTYN, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const code = msg.read.int32();
			const player = msg.read.uint8();
			const loc = msg.read.uint8();
			const seq = msg.read.uint8();
			msg.index ++;
			const desc = msg.read.uint32();
			if (code === undefined
				|| player === undefined
				|| loc === undefined
				|| seq === undefined
				|| desc === undefined)
				return;
			const card = this.get.card(player, loc, seq);
			await this.update.codes([[card, code]]);
			connect.response = async (i : boolean) => {
				connect.duel.select.confirm.show = false;
				await send(new Msg()
						.write.uint8(CTOS.RESPONSE)
					.write.uint32(Number(i))
				);
			};
			connect.duel.select.confirm.title = desc === 0
				? this.event + mainGame.get.strings.system(200, [mainGame.get.location(loc), mainGame.get.desc(desc)])
				: desc === 221 ? this.event + mainGame.get.strings.system(221, [mainGame.get.location(loc), mainGame.get.desc(desc)])
				: desc <= mainGame.max_string_id ? mainGame.get.strings.system(desc, mainGame.get.name(code))
				: mainGame.get.desc(desc, mainGame.get.name(code));
			connect.duel.select.confirm.show = true;
		}],
		[MSG.SELECT_YESNO, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const desc = msg.read.uint32();
			if (desc === undefined) return;
			connect.response = async (i : boolean) => {
				connect.duel.select.confirm.show = false;
				await send(new Msg()
						.write.uint8(CTOS.RESPONSE)
					.write.uint32(Number(i))
				);
			};
			connect.duel.select.confirm.title = mainGame.get.desc(desc);
			connect.duel.select.confirm.show = true;
		}],
		[MSG.SELECT_OPTION, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const ct = msg.read.uint8();
			if (ct === undefined) return;
			connect.response = async (i : number) => {
				connect.duel.select.option.show = false;
				await send(new Msg()
					.write.uint8(CTOS.RESPONSE)
					.write.uint32(i)
				);
			};
			connect.duel.select.option.array = new Array(ct)
				.map(() => msg.read.uint32())
				.map(i => mainGame.get.desc(i ?? - 1));
			connect.duel.select.option.title = mainGame.get.strings.system(this.select_hint ?? 555);
			connect.duel.select.option.show = true;
			this.select_hint = 0;
		}],
		[MSG.SELECT_CARD, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const cancelable = msg.read.uint8();
			const min = msg.read.uint8();
			const max = msg.read.uint8();
			if (cancelable === undefined || min === undefined || max === undefined)
				return;
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const ct = msg.read.uint8();
				if (code === undefined || loc === undefined || seq === undefined || ct === undefined)
					return;
				const card = loc
					? this.get.overlay(tp, loc, seq, ct)
						?? this.get.card(tp, loc, seq)
					: new Client_Card()
						.set.pos(POS.FACEUP_ATTACK);
				if (card)
					codes.push([card, code]);
			}
			await this.update.codes(codes);
			const title = !!this.select_hint ? mainGame.get.desc(this.select_hint)
				: mainGame.get.strings.system(560);
			connect.duel.select.cards.cancelable = !!cancelable;
			connect.duel.select.cards.cards = codes.map(i => i[0]);
			connect.duel.select.cards.min = min;
			connect.duel.select.cards.max = max;
			connect.duel.select.cards.title = title;
			connect.duel.select.cards.selected.length = 0;
			this.select_hint = 0;
			connect.response = async (i ?: Array<Client_Card> | Client_Card) => {
				connect.duel.select.cards.show = false;
				const msg = new Msg()
					.write.uint8(CTOS.RESPONSE);
				if (i) {
					msg.write.uint8(codes.length);
					Array.isArray(i)
						? i.forEach(i => msg.write.uint8(
							connect.duel.select.cards.cards
								.indexOf(i)
						))
						: msg.write.uint8(connect.duel.select.cards.cards.indexOf(i));
				} else msg.write.uint32(- 1);
				await send(msg);
			};
			connect.duel.select.cards.show = true;
		}],
		[MSG.SELECT_UNSELECT_CARD, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const cancelable = !!msg.read.uint8() || !!msg.read.uint8();
			const min = msg.read.uint8();
			const max = msg.read.uint8();
			if (min === undefined || max === undefined)
				return;
			const codesI : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const ct = msg.read.uint8();
				if (code === undefined || loc === undefined || seq === undefined || ct === undefined)
					return;
				const card = loc
					? this.get.overlay(tp, loc, seq, ct)
						?? this.get.card(tp, loc, seq)
					: new Client_Card()
						.set.pos(POS.FACEUP_ATTACK);
				if (card)
					codesI.push([card, code]);
			}
			const codesII : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const ct = msg.read.uint8();
				if (code === undefined || loc === undefined || seq === undefined || ct === undefined)
					return;
				const card = loc
					? this.get.overlay(tp, loc, seq, ct)
						?? this.get.card(tp, loc, seq)
					: new Client_Card()
						.set.pos(POS.FACEUP_ATTACK);
				if (card)
					codesII.push([card, code]);
			}
			await this.update.codes(codesI.concat(codesII));
			const title = !!this.select_hint ? mainGame.get.desc(this.select_hint)
				: mainGame.get.strings.system(560);
			connect.duel.select.group.cancelable = cancelable;
			connect.duel.select.group.unselect = codesI.map(i => i[0]);
			connect.duel.select.group.select = codesII.map(i => i[0]);
			connect.duel.select.group.min = min;
			connect.duel.select.group.max = max;
			connect.duel.select.group.title = title;
			this.select_hint = 0;
			connect.response = async (i ?: Client_Card) => {
				connect.duel.select.group.show = false;
				const msg = new Msg()
					.write.uint8(CTOS.RESPONSE)
				if (i) {
					const ct = connect.duel.select.group.unselect.indexOf(i);
					msg.write.uint32(ct > - 1
						? ct
						: connect.duel.select.group.unselect.length
							+ connect.duel.select.group.select.indexOf(i)
					);
				} else msg.write.uint32(- 1);
				await send(msg);
			};
			connect.duel.select.group.show = true;
		}],
		[MSG.SELECT_CHAIN, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const ct = msg.read.uint8() ?? 0;
			msg.index += 9;
			const codes : Array<[Client_Card, number]> = [];
			let cancelable = true;
			for (let i = 0; i < ct; i ++) {
				let flag = msg.read.uint8();
				const forced = msg.read.uint8();
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const ct = msg.read.uint8();
				const desc = msg.read.uint32();
				if (flag === undefined
					|| forced === undefined
					|| code === undefined
					|| loc === undefined
					|| seq === undefined
					|| ct === undefined
					|| desc === undefined)
					return;
				flag |= forced << 8;
				const card = loc
					? this.get.overlay(tp, loc, seq, ct)
						?? this.get.card(tp, loc, seq)
					: new Client_Card()
						.set.pos(POS.FACEUP_ATTACK);
				if (card) {
					codes.push([card, code]);
					card.set.activate(COMMAND.ACTIVATE, i, desc);
					cancelable = cancelable && !forced;
				}
			}
			if (codes.length) {
				await this.update.codes(codes);
				connect.duel.select.cards.cancelable = cancelable;
				connect.duel.select.cards.cards = codes.map(i => i[0]);
				connect.duel.select.cards.min = 1;
				connect.duel.select.cards.max = 1;
				connect.duel.select.cards.title = this.event + mainGame.get.strings.system(203);
				connect.duel.select.cards.selected.length = 0;
				this.select_hint = 0;
				const option = (effect : Array<{ desc ?: number; index : number; }>) => {
					const array = effect
						.map(i => mainGame.get.desc(i.desc ?? - 1));
					connect.duel.select.option.cancelable = true;
					connect.duel.select.option.title = this.event + mainGame.get.strings.system(203);
					connect.duel.select.option.array = array;
					connect.duel.select.option.show = true;
					connect.duel.select.option.confirm = async (i ?: number) => {
						connect.duel.select.option.show = false;
						i !== undefined ? connect.response?.(effect[i].index)
							: connect.duel.select.cards.show = true;
					}
				};
				connect.response = async (i : number) => await send(
					new Msg()
						.write.uint8(CTOS.RESPONSE)
						.write.uint32(i)
				);
				connect.duel.select.cards.confirm = async (i ?: Client_Card) => {
					connect.duel.select.cards.show = false;
					if (i)
						i.get.activate(KEYS.ACTIVATE).length > 1
							? option(i.get.activate(KEYS.ACTIVATE))
							: await connect.response?.(i.get.activate(KEYS.ACTIVATE)[0].index);
					else
						await connect.response?.(- 1);
				};
				connect.duel.select.cards.show = true;
			} else
				await send(new Msg()
					.write.uint8(CTOS.RESPONSE)
					.write.uint32(- 1)
				);
		}],
		[MSG.SELECT_PLACE, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			const tp = msg.read.uint8();
			const ct = Math.max(msg.read.uint8() ?? 1, 1);
			const data = ~ (msg.read.int32() ?? 0);
			const place = tp === this.to.player(0) ? data : (data >> 16) | (data << 16);
			const plaids = duel.get.plaids().filter(i => i.data & place);
			const title = !!this.select_hint ? mainGame.get.strings.system(569, mainGame.get.name(this.select_hint))
				: mainGame.get.strings.system(560);
			this.select_hint = 0;
			connect.duel.select.plaid.title = title;
			connect.duel.select.plaid.plaids = plaids
			connect.duel.select.plaid.cards = plaids.map(i => this.get.card(i.owner, i.location, i.seq));
			connect.duel.select.plaid.min = ct;
			connect.duel.select.plaid.cancelable = false;
			connect.response = async (i ?: Plaid) => {
				connect.duel.select.plaid.show = false;
				const msg = new Msg()
					.write.uint8(CTOS.RESPONSE);
				if (i)
					msg.write.uint8(this.to.player(i.owner === 2 ? 0 : i.owner))
						.write.uint8(i.location)
						.write.uint8(i.seq);
				else
					msg.write.uint8(this.to.player(0))
						.write.uint8(0)
						.write.uint8(0);
				await send(msg);
			};
			connect.duel.select.plaid.show = true;
		}],
		[MSG.SELECT_POSITION, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const code = msg.read.int32();
			const pos = msg.read.uint8();
			if (code === undefined || pos === undefined)
				return;

			await mainGame.load.pic([code]);
			if ([POS.FACEUP_ATTACK,
					POS.FACEUP_DEFENSE,
					POS.FACEDOWN_ATTACK,
					POS.FACEDOWN_DEFENSE
				].includes(pos))
				await send(new Msg()
					.write.uint8(CTOS.RESPONSE)
					.write.uint32(pos)
				)
			else {
				const title = mainGame.get.strings.system(561);
				connect.duel.select.pos.title = title;
				connect.duel.select.pos.id = code;
				connect.duel.select.pos.pos = pos;
				connect.response = async (i : number) => {
					connect.duel.select.pos.show = false;
					await send(new Msg()
						.write.uint8(CTOS.RESPONSE)
						.write.uint32(i)
					);
				};
				connect.duel.select.pos.show = true;
			}
		}],
		[MSG.SELECT_TRIBUTE, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const cancelable = msg.read.uint8();
			const min = msg.read.uint8();
			const max = msg.read.uint8();
			if (cancelable === undefined || min === undefined || max === undefined)
				return;
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const ct = msg.read.uint8();
				if (code === undefined || loc === undefined || seq === undefined || ct === undefined)
					return;
				const card = loc
					? this.get.overlay(tp, loc, seq, ct)
						?? this.get.card(tp, loc, seq)
					: new Client_Card()
						.set.pos(POS.FACEUP_ATTACK);
				if (card)
					codes.push([card, code]);
			}
			await this.update.codes(codes);
			const title = !!this.select_hint ? mainGame.get.desc(this.select_hint)
				: mainGame.get.strings.system(531);
			connect.duel.select.cards.cancelable = !!cancelable;
			connect.duel.select.cards.cards = codes.map(i => i[0]);
			connect.duel.select.cards.min = min;
			connect.duel.select.cards.max = max;
			connect.duel.select.cards.title = title;
			connect.duel.select.cards.selected.length = 0;
			this.select_hint = 0;
			connect.response = async (i ?: Array<Client_Card> | Client_Card) => {
				connect.duel.select.cards.show = false;
				const msg = new Msg()
						.write.uint8(CTOS.RESPONSE)
				if (i) {
					msg.write.uint8(codes.length);
					Array.isArray(i)
						? i.forEach(i => msg.write.uint8(
							connect.duel.select.cards.cards
								.indexOf(i)
						))
						: msg.write.uint8(connect.duel.select.cards.cards.indexOf(i));
				} else msg.write.uint32(- 1);
				await send(msg);
			};
			connect.duel.select.cards.show = true;
		}],
		[MSG.SELECT_COUNTER, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index ++;
			const counter = msg.read.uint16();
			const count = msg.read.uint16();
			if (counter === undefined || count === undefined)
				return;
			const cards : Array<Client_Card> = [];
			const counts : Array<number> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				msg.index += 4;
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				const ct = msg.read.uint16();
				if (loc === undefined || seq === undefined || ct === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card) {
					cards.push(card);
					counts.push(ct);
				}
			}
			connect.duel.select.counter.cards = cards
			connect.duel.select.counter.counter = counter;
			connect.duel.select.counter.count = count;
			connect.duel.select.counter.counts = counts;
			connect.duel.select.counter.title = mainGame.get.strings.system(204, [count, mainGame.get.strings.counter(counter)]);
			connect.response = async (i : Array<number>) => {
				connect.duel.select.counter.show = false;
				const msg = new Msg()
					.write.uint8(CTOS.RESPONSE);
				for (const ct of i)
					msg.write.int16(ct);
				await send(msg);
			};
			connect.duel.select.counter.show = true;
			return;
		}],
		[MSG.SELECT_SUM, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			msg.index += 6;
			const min = msg.read.uint8();
			const max = msg.read.uint8();
			if (min === undefined || max === undefined)
				return;
			const selected : Array<Client_Card> = [];
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				msg.index += 4;
				if (code === undefined || loc === undefined || seq === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card) {
					codes.push([card, code]);
					selected.push(card);
				}
			}
			const select : Array<Client_Card> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				msg.index += 4;
				if (code === undefined || loc === undefined || seq === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card) {
					codes.push([card, code]);
					select.push(card);
				}
			}
			await this.update.codes(codes);
			const title = !!this.select_hint ? mainGame.get.desc(this.select_hint)
				: mainGame.get.strings.system(560);
			connect.duel.select.cards.cancelable = false;
			connect.duel.select.cards.cards = codes.map(i => i[0]);
			connect.duel.select.cards.min = min;
			connect.duel.select.cards.max = max;
			connect.duel.select.cards.title = title;
			connect.duel.select.cards.selected = selected;
			this.select_hint = 0;
			connect.response = async (i : Array<Client_Card>) => {
				connect.duel.select.cards.show = false;
				const msg = new Msg()
					.write.uint8(CTOS.RESPONSE);
				msg.write.uint32(codes.length);
				for (const c of i) {
					const ct = select.indexOf(c);
					msg.write.uint32(ct > - 1 ? ct : 0);
				}
				await send(msg);
			};
			connect.duel.select.cards.show = true;
		}],
		[MSG.SORT_CARD, async (msg : Msg, send : (msg : Msg) => Promise<void>) => {
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				if (code === undefined || loc === undefined || seq === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card)
					codes.push([card, code]);
			}
			await this.update.codes(codes);
			connect.duel.select.sort.cards = codes.map(i => i[0]);
			connect.duel.select.sort.title = mainGame.get.strings.system(205);
			connect.response = async (i : Array<number>) => {
				connect.duel.select.sort.show = false;
				const msg = new Msg()
					.write.uint8(CTOS.RESPONSE);
				for (const ct of i)
					msg.write.uint32(ct);
				await send(msg);
			};
			connect.duel.select.sort.show = true;
		}],
		[MSG.CONFIRM_CARDS, async (msg : Msg) => {
			msg.index += 2;
			const codes : Array<[Client_Card, number]> = [];
			for (let i = 0; i < (msg.read.uint8() ?? 0); i ++) {
				const code = msg.read.int32();
				const tp = this.to.player(msg.read.uint8() ?? 0);
				const loc = msg.read.uint8();
				const seq = msg.read.uint8();
				if (code === undefined || loc === undefined || seq === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card)
					codes.push([card, code]);
			}
			await this.update.codes(codes);
			history.push(HISTORY.CONFIRM, {
				self : false,
				cards : codes.map(i => {return { id : i[1], pos : POS.FACEUP_ATTACK }; }),
				avatar : mainGame.get.avatar(0)
			});
			await duel.confrim.hand(codes.map(i => i[0]));
		}],
		[MSG.SHUFFLE_DECK, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			await duel.sort.deck(tp);
		}],
		[MSG.SHUFFLE_HAND, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			msg.index ++;
			const codes : Array<number> = [];
			const ct = duel.get.cards()
				.filter(i => i.owner === tp && (i.location & LOCATION.HAND)).length;
			for (let i = 0; i < ct; i ++) {
				const code = msg.read.int32();
				if (code === undefined) return;
				codes.push(code);
			}
			await duel.sort.hand(tp, codes);
		}],
		[MSG.SHUFFLE_EXTRA, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			msg.index ++;
			const codes : Array<number> = [];
			const ct = duel.get.cards()
				.filter(i => i.owner === tp && (i.location & LOCATION.EXTRA)).length;
			for (let i = 0; i < ct; i ++) {
				const code = msg.read.int32();
				if (code === undefined) return;
				codes.push(code);
			}
			await duel.sort.ex_deck(tp);
		}],
		[MSG.SWAP_GRAVE_DECK, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			const cards = duel.cards
				.filter(i => i.owner === tp)
			const grave = cards.filter(i => i.location & LOCATION.GRAVE);
			const deck = cards.filter(i => i.location & LOCATION.DECK);
			deck.forEach((i, v) => i
				.set.location(LOCATION.GRAVE)
				.set.seq(v)
			);
			let j = 0;
			let k = cards
				.filter(i => i.location & LOCATION.EXTRA).length;
			grave.forEach(i => {
				if (i.type & (TYPE.FUSION | TYPE.SYNCHRO | TYPE.XYZ | TYPE.LINK)) {
					i
						.set.location(LOCATION.EXTRA)
						.set.seq(k)
						.set.pos(POS.FACEDOWN_ATTACK);
					k ++;
				} else {
					i
						.set.location(LOCATION.DECK)
						.set.seq(j);
					j ++;
				}
			});
			await duel.update();
		}],
		[MSG.REVERSE_DECK, async () => {
			duel.cards.filter(i => i.location & LOCATION.DECK)
				.forEach(i => i.set.pos(POS.FACEUP_ATTACK))
			await duel.update();
		}],
		[MSG.DECK_TOP, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			const seq = msg.read.uint8();
			const code = msg.read.int32();
			if (seq === undefined || code === undefined)
				return;
			const cards = duel.get.cards()
				.filter(i => i.owner === tp && i.location & LOCATION.DECK);
			const card = cards[cards.length - 1 - seq];
			this.update.codes([[card, code & 0x7fffffff]]);
			await duel.confrim.decktop(card);
		}],
		[MSG.SHUFFLE_SET_CARD, async (msg : Msg) => {
			const loc = msg.read.uint8() === LOCATION.MZONE ? LOCATION.MZONE : LOCATION.SZONE;
			const cards : Array<Client_Card> = [];
			const ct = msg.read.uint8() ?? 0;
			for (let i = 0; i < ct; i ++) {
				const tp = this.to.player(msg.read.uint8() ?? 0);
				msg.index ++;
				const seq = msg.read.uint8();
				if (seq === undefined)
					return;
				const card = this.get.card(tp, loc, seq);
				if (card) {
					cards.push(card);
					card.set.id(0);
				}
			}
			for (let i = 0; i < ct; i ++) {
				const tp = this.to.player(msg.read.uint8() ?? 0);
				msg.index ++;
				const seq = msg.read.uint8();
				msg.index ++;
				if (seq === undefined)
					return;
				const ps = cards[i].seq;
				duel.get.cards()
					.filter(i => i.owner === tp && (i.location & loc) && i.seq === ps)
					.forEach(i => i.seq = seq);
				duel.get.cards()
					.filter(i => i.owner === tp && (i.location & loc) && i.seq === seq)
					.forEach(i => i.seq = ps);
			}
			await duel.update();
		}],
		[MSG.NEW_TURN, async (msg : Msg) => {
			const tp = this.to.player((msg.read.uint8() ?? 0) & 0x1);
			connect.duel.turn = tp;
			connect.duel.turns[tp] ++;
			history.push(HISTORY.TURN, {
				self : !tp,
				cards : [],
				avatar : mainGame.get.avatar(0),
				number : connect.duel.turns[tp]
			});
		}],
		[MSG.NEW_PHASE, async (msg : Msg) => {
			const p = msg.read.uint16();
			if (p === undefined)
				return;
			await phase.on(connect.duel.turn, p);
			history.push(HISTORY.PHASE, {
				self : true,
				cards : [],
				avatar : mainGame.get.avatar(0),
				number : p
			});
		}],
		[MSG.MOVE, async (msg : Msg) => {
			const code = msg.read.int32();
			const from = {
				tp : this.to.player(msg.read.uint8() ?? 0),
				loc : msg.read.uint8(),
				seq : msg.read.uint8(),
				ct : msg.read.uint8()
			};
			const to = {
				tp : this.to.player(msg.read.uint8() ?? 0),
				loc : msg.read.uint8(),
				seq : msg.read.uint8(),
				pos : msg.read.uint8()
			};
			const reason = msg.read.int32();
			if (code === undefined || reason === undefined
				|| Object.values(from).includes(undefined)
				|| Object.values(to).includes(undefined)
			)
				return;
			await mainGame.load.pic([code]);

			let card : Client_Card | undefined = undefined;
			if (!from.loc)
				card = duel.add.card(to.tp, to.loc!, to.seq!, to.pos, code);
			else if (!to.loc) {
				const c = this.get.overlay(from.tp, from.loc!, from.seq!, from.ct!)
					?? this.get.card(from.tp, from.loc!, from.seq!);
				if (c)
					duel.remove.card(c);
			} else {
				const c = this.get.overlay(from.tp, from.loc!, from.seq!, from.ct!)
					?? this.get.card(from.tp, from.loc!, from.seq!);
				if (c) {
					card = c;
					card
						.set.id(code)
						.set.owner(to.tp)
						.set.location(to.loc!)
						.set.seq(to.seq!)
						.set.pos(to.pos!);
				}
			}
			if (card)
				history.push(HISTORY.MOVE, {
					self : true,
					cards : [{
						id : card.id,
						pos : card.id ? POS.FACEUP_ATTACK : POS.FACEDOWN_ATTACK
					}],
					from : mainGame.get.location(from.loc!),
					to : mainGame.get.location(to.loc!)
				});
			await duel.update();
		}],
		[MSG.DRAW, async (msg : Msg) => {
			const tp = this.to.player(msg.read.uint8() ?? 0);
			const ct = msg.read.uint8();
			if (ct === undefined)
				return;
			this.event = mainGame.get.strings.system(1611 + tp, ct);
			const codes : Array<number> = [];
			for (let i = 0; i < ct; i ++)
				codes.push(msg.read.uint32() ?? 0);
			await mainGame.load.pic(codes);
			history.push(HISTORY.DRAW, {
				self : !tp,
				cards : codes.map(i => {return { id : i, pos : POS.FACEUP_ATTACK }; }),
				avatar : mainGame.get.avatar(tp)
			});
			await duel.update(duel.draw(tp, ct, codes));
		}],
	]);
};

export default Protocol;