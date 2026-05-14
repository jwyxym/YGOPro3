import { reactive } from 'vue';

import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import invoke from '@/script/invoke';
import Card from '@/script/card';
import { I18N_KEYS } from '@/script/language/i18n';

import Deck from '@/pages/deck/deck';
import { toast } from '@/pages/toast/toast';
import { voice } from '@/pages/voice/voice';

import ws, { Ws } from './ygo-protocol/ws';
import tcp, { Tcp } from './ygo-protocol/tcp';
import Protocol from './ygo-protocol/protocol';
import Msg from './ygo-protocol/msg';
import { CTOS } from './ygo-protocol/network';

import * as Selecter from './selecter/selecter';

import Client_Card from './scene/client_card';

import { history } from './log/history/history';
import { chat } from './log/chat';

class Wait {
	players = [
		{ name : '', status : false, avatar : mainGame.get.avatar(0) },
		{ name : '', status : false, avatar : mainGame.get.avatar(0) },
		{ name : '', status : false, avatar : mainGame.get.avatar(1) },
		{ name : '', status : false, avatar : mainGame.get.avatar(1) }
	];
	self = {
		is_host : false,
		position : 0 as 0 | 1 | 2 | 3,
	};
	info = {
		room_name : '',
		lflist : 0,
		rule : 0,
		mode : 0,
		duel_rule : 0,
		no_check_deck : false,
		no_shuffle_deck : false,
		start_lp : 0,
		start_hand : 0,
		draw_count : 0,
		time_limit : 0,
		watch : 0
	};
	kick = async (v : number) : Promise<void> => await connect.send?.(
		new Msg()
			.write.uint8(CTOS.HS_KICK)
			.write.uint8(v)
	);
	deck = {
		current : undefined as undefined | Deck,
		send : async (deck ?: Deck) : Promise<void> => {
			if (deck) {
				this.deck.current = deck;
				if (this.players[this.self.position].status)
					await connect.send?.(new Msg()
						.write.uint8(CTOS.HS_NOTREADY));
				const msg = new Msg()
					.write.uint8(CTOS.UPDATE_DECK)
					.write.uint32(deck.main.length + deck.extra.length)
					.write.uint32(deck.side.length);
				for (const i of deck.main
					.concat(deck.extra)
					.concat(deck.side)
				)
					msg.write.uint32(i);
				await connect.send?.(msg);
				await connect.send?.(new Msg()
					.write.uint8(CTOS.HS_READY));
			} else
				await connect.send?.(new Msg()
					.write.uint8(CTOS.HS_NOTREADY));
		},
		chk : async (
			result ?: (value : string | true | PromiseLike<string | true>) => void
		) : Promise<string | true> => this.deck.result = result as any,
		promise : undefined as Promise<string | true> | undefined,
		result : undefined as ((value : string | true | PromiseLike<string | true>) => void) | undefined
	}
	duelist = async () => await connect.send?.(
		new Msg()
			.write.uint8(CTOS.HS_TODUELIST)
	);
	watcher = async () => await connect.send?.(
		new Msg()
			.write.uint8(CTOS.HS_TOOBSERVER)
	);
	start = async () => await connect.send?.(
		new Msg()
			.write.uint8(CTOS.HS_START)
	);
};

class Player {
	index : number;
	name : string;
	time : number;
	lp : number;
	desc : Map<number, number>;
	constructor () {
		this.index = - 1;
		this.name = '';
		this.time = 0;
		this.lp = 0;
		this.desc = new Map();
	};
	async change_lp (lp : number) : Promise<void> {
		this.lp = lp;
		await mainGame.sleep(600);
	};
	async lose_lp (lp : number) : Promise<void> {
		this.lp -= lp;
		await mainGame.sleep(600);
	};
	async recover_lp (lp : number) : Promise<void> {
		this.lp += lp;
		await mainGame.sleep(600);
	};
};

class Duel {
	is_first = false;
	card : undefined | Client_Card | Card | number = undefined;
	cards : Array<Client_Card> = [];
	player : [Player, Player] = reactive([new Player(), new Player()]);
	chain : Array<Client_Card> = [];
	turn : 0 | 1 = 0;
	time_player : 0 | 1 = 0;
	turns : [number, number] = [0, 0];
	shuffle = false;
	reverse = false;
	select = {
		cards : new Selecter.Cards(),
		group : new Selecter.Group(),
		confirm : new Selecter.Confirm(),
		code : new Selecter.Codes(),
		plaid : new Selecter.Plaids(),
		number : new Selecter.Number(),
		option : new Selecter.Option(),
		race : new Selecter.Race(),
		attribute : new Selecter.Attribute(),
		pos : new Selecter.Pos(),
		counter : new Selecter.Counter(),
		sort : new Selecter.Sort(),
		chk : () : boolean => [
			connect.duel.select.cards.show,
			connect.duel.select.group.show,
			connect.duel.select.confirm.show,
			connect.duel.select.code.show,
			connect.duel.select.plaid.show,
			connect.duel.select.number.show,
			connect.duel.select.option.show,
			connect.duel.select.race.show,
			connect.duel.select.attribute.show,
			connect.duel.select.pos.show,
			connect.duel.select.counter.show,
			connect.duel.select.sort.show,
			connect.duel.rps.show
		].includes(true)
	};
	rps = {
		show : false,
		head : CTOS.HAND_RESULT,
		send : async (v : number) : Promise<void> => await connect.send?.(
			new Msg()
				.write.uint8(connect.duel.rps.head)
				.write.uint8(v)
		)
	};
};
const connect = reactive({
	debouncing : false,
	srv_cache : new Map<string, string>(),
	state : 0 as 0 | 1 | 2 | 3 | 4,
	wait : new Wait(),
	duel : new Duel(),
	protocol : undefined as undefined | Tcp | Ws,
	chat : {
		show : false,
		on : () : void => connect.chat.show ? connect.chat.off()
			: (() => {
				connect.chat.show = true;
				toast.clear();
			})(),
		off : () : void => connect.chat.show = false as any,
	},
	send : undefined as undefined | ((msg : Msg) => Promise<void>),
	response : undefined as undefined | ((...args : any[]) => Promise<void>),
	on : async (i ?: {
		name : string;
		pass : string;
		address : string;
		protocal : 0 | 1 | 2;
	} | {
		name : string;
		args : string;
	} | Deck) => {
		if (connect.debouncing)
			return;
		connect.debouncing = true;
		try {
			switch (connect.state) {
				case 0:
					const callback = (name : string, pass : string, address : string) => {
						const protocol = new Protocol();
						return {
							on_connect : async (send : (msg : Msg) => Promise<void>) : Promise<void> => {
								connect.send = send;
								connect.state = 1;
								await send(new Msg()
									.write.uint8(CTOS.EXTERNAL_ADDRESS)
									.write.uint32(0)
									.write.str(address));
								await send(new Msg()
									.write.uint8(CTOS.PLAYER_INFO)
									.write.str(name, 40));
								await send(new Msg()
									.write.uint8(CTOS.JOIN_GAME)
									.write.uint16(mainGame.version)
									.write.uint16(0)
									.write.uint32(0)
									.write.str(pass, 40));
							},
							on_message : protocol.read,
							on_disconnect : async () : Promise<void> => {
								connect.clear();
								connect.state = 0;
								voice.play(KEYS.BACK_BGM);
							}
						};
					};
					const local_server = i && 'args' in i;
					if (local_server) {
						const address = 'localhost:7911';
						await invoke.server.start(i.args);
						const p = callback(i.name, '', address);
						connect.protocol = tcp;
						await connect.protocol.connect(address, p);
					} else {
						const para = i as {
							name : string;
							pass : string;
							address : string;
							protocal : 0 | 1 | 2;
						};
						if (!para.name)
							throw mainGame.get.text(I18N_KEYS.SERVER_NAME_ERROR);
						else if (!para.address)
							throw mainGame.get.text(I18N_KEYS.SERVER_ADDRESS_ERROR);
						const p = callback(para.name, para.pass, para.address);
						const get_srv = async () => {
							const address = para!.address;
							if (!address.includes(':') && !para.protocal)
								para!.address = connect.srv_cache.get(address) ??
									await (async () : Promise<string> => {
										const url = await invoke.game.get_srv(address)
										connect.srv_cache.set(address, url);
										return url;
									})();
						};
						switch (para!.protocal) {
							case 0:
								connect.protocol = tcp;
								break;
							case 1:
								para!.address = `ws://${para!.address}`;
								connect.protocol = ws;
								break;
							case 2:
								para!.address = `wss://${para!.address}`;
								connect.protocol = ws;
								break;
						}
						await Promise.all([
							mainGame.set.system(KEYS.SETTING_SERVER_PLAYER_NAME, para.name, false),
							mainGame.set.system(KEYS.SETTING_SERVER_PASS, para.pass, false),
							get_srv()
						]);
						await Promise.all([
							mainGame.set.system(KEYS.SETTING_SERVER_ADDRESS, para.address),
							connect.protocol.connect(para.address, p)
						]);
					}
					break;
				case 1:
					connect.wait.players.filter(i => i.status).length < (connect.wait.info.mode & 0x2 ? 4 : 2)
						? toast.info(mainGame.get.text(I18N_KEYS.SERVER_PLAYER_ERROR))
						: await connect.wait.start();
					break;
				case 2:
					history.clear();
					chat.clear();
					connect.chat.off();
					connect.state = 3;
					connect.duel.player[0] = new Player();
					connect.duel.player[1] = new Player();
					connect.duel.chain.length = 0;
					
					connect.duel.select.cards.show = false;
					Object.values(connect.duel.select).forEach(i => {
						if ('show' in i)
							i.show = false;
					});
					break;
				case 3:
					const deck = i as Deck;  
					const msg = new Msg()
						.write.uint8(CTOS.UPDATE_DECK)
						.write.uint32(deck.main.length + deck.extra.length)
						.write.uint32(deck.side.length);
					for (const i of deck.main
						.concat(deck.extra)
						.concat(deck.side)
					)
						msg.write.uint32(i);
					await connect.send?.(msg);
					break;
			}
		} catch (e) {
			toast.error(e);
		} finally {
			connect.debouncing = false;
		}
	},
	close : async () => {
		connect.protocol?.disconnect()
			.then()
			.catch();
		connect.clear();
	},
	clear : async () => {
		connect.chat.off();
		history.clear();
		chat.clear();
		connect.state = 0;
		connect.wait = new Wait();
		connect.duel = new Duel();
		connect.response = undefined;
		connect.send = undefined;
		connect.protocol = undefined;
	}
});


export default connect;
export { Player };