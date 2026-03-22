import { reactive } from 'vue';
import Deck from '@/pages/deck/deck';
import ws from './ygo-protocol/ws';
import tcp from './ygo-protocol/tcp';
import Protocol from './ygo-protocol/protocol';
import Msg from './ygo-protocol/msg';
import { CTOS } from './ygo-protocol/network';
import mainGame from '@/script/game';
import Client_Card from './scene/client_card';

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
	state : 0 as 0 | 1 | 2 | 3,
	wait : new Wait(),
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
				let c;
				switch (para!.protocal) {
					case 0:
						c = tcp;
						break;
					case 1:
						para!.address = `ws://${para!.address}`;
						c = ws;
						break;
					case 2:
						para!.address = `wss://${para!.address}`;
						c = ws;
						break;
				}
				await c.connect(para!.address, p);
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
		connect.state = 0;
		connect.wait = new Wait();
		connect.send = undefined;
	}
});


export default connect;