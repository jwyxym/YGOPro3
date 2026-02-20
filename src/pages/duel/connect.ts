import { reactive } from 'vue';
import Deck from '@/pages/deck/deck';

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

const connect = reactive({
	state : 0 as 0 | 1 | 2 | 3,
	wait : new Wait(),
	on : async (para ?: { name : string; pass : string; address : string; }) => {
		switch (connect.state) {
			case 0:
				break;
			case 1:
				break;
			case 2:
				break;
			case 3:
				break;
		}
		connect.state > 2 ? connect.state = 0 : connect.state ++;
	},
	clear : () => {
		connect.state = 0;
	},
});


export default connect;