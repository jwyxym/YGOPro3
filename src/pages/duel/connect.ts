import { reactive } from 'vue';
import Deck from '@/pages/deck/deck';
import ws, { Ws } from './ygo-protocol/ws';
import tcp, { Tcp } from './ygo-protocol/tcp';
import Protocol from './ygo-protocol/protocol';
import Msg from './ygo-protocol/msg';
import { CTOS } from './ygo-protocol/network';
import mainGame from '@/script/game';
import Client_Card from './scene/client_card';
import { KEYS } from '@/script/constant';
import invoke from '@/script/invoke';

class Wait {
	players = [
		{ name : '', status : false },
		{ name : '', status : false },
		{ name : '', status : false },
		{ name : '', status : false }
	];
	self = {
		is_host : false,
		position : 0 as 0 | 1 | 2 | 3,
		deck : true as string | true
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
	kick = async () => {

	};
	deck = async (deck ?: Deck) => {

	};
	duelist = async () => {

	};
	watcher = async () => {

	};
};

class SelectCards {
	show = false;
	cancelable = false;
	cards : Array<Client_Card> = [];
	min = 0;
	max = 0;
	title = '';
};

const connect = reactive({
	srv_cache : new Map<string, string>(),
	state : 0 as 0 | 1 | 2 | 3,
	wait : new Wait(),
	protocol : undefined as undefined | Tcp | Ws,
	select_cards : new SelectCards(),
	send : undefined as undefined | ((msg : Msg) => Promise<void>),
	on : async (para ?: { name : string; pass : string; address : string; protocal : 0 | 1 | 2; }) => {
		switch (connect.state) {
			case 0:
				const protocol = new Protocol(
					async () : Promise<void> => connect.state = 2 as any,
					async () : Promise<void> => connect.state = 3 as any
				);
				const p = {
					on_connect : async (send : (msg : Msg) => Promise<void>) : Promise<void> => {
						connect.send = send;
						connect.state = 1;
						await send(new Msg()
							.write.uint8(CTOS.EXTERNAL_ADDRESS)
							.write.uint32(0)
							.write.str(para!.address));
						await send(new Msg()
							.write.uint8(CTOS.PLAYER_INFO)
							.write.str(para!.name, 40));
						await send(new Msg()
							.write.uint8(CTOS.JOIN_GAME)
							.write.uint16(mainGame.version)
							.write.uint16(0)
							.write.uint32(0)
							.write.str(para!.pass, 40));
					},
					on_message : protocol.read,
					on_disconnect : async () : Promise<void> => {
						protocol.clear();
						connect.state = 0;
					}
				};
				const get_srv = async () => {
					const address = para!.address;
					if (!address.includes(':') && !para!.protocal)
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
					mainGame.set.system(KEYS.SETTING_SERVER_PLAYER_NAME, para!.name, false),
					mainGame.set.system(KEYS.SETTING_SERVER_PASS, para!.pass, false),
					mainGame.set.system(KEYS.SETTING_SERVER_ADDRESS, para!.address, false),
					get_srv()
				]);
				await Promise.all([
					mainGame.set.system(KEYS.SETTING_SERVER_PROTOCAL, para!.protocal),
					connect.protocol.connect(para!.address, p)
				]);
				break;
			case 1:
				break;
			case 2:
				break;
			case 3:
				break;
		}
	},
	clear : () => {
		connect.protocol?.disconnect()
			.then(() => {});
		connect.protocol = undefined;
		connect.state = 0;
		connect.wait = new Wait();
		connect.send = undefined;
	}
});


export default connect;