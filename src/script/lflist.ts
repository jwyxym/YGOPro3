import { KEYS } from "./constant";
import mainGame from "./game";

class LFList {
	name : string;
	hash : number;
	genesys : number;
	lflist : Map<number, number>;
	glist : Map<number, number>;
	constructor (name : string, obj : {
		hash : number;
		genesys : number;
		lflist : Array<[number, number]>;
		glist : Array<[number, number]>;
	}) {
		this.name = name;
		this.hash = obj.hash;
		this.genesys = obj.genesys;
		this.lflist = new Map(obj.lflist);
		this.glist = new Map(obj.glist);
	};

	get = {
		lflist : (code : number | string) : number => {
			let card = mainGame.get.card(code);
			while (card.alias !== 0 && Math.abs(card.id - card.alias) <= 20) {
				const c = mainGame.get.card(card.alias);
				if (c === mainGame.unknown)
					break;
				card = c;
			}
			return this.lflist.get(card.id) ?? mainGame.get.system(KEYS.SETTING_CT_CARD) as number;
		},
		glist : (code : number | string) : number => {
			let card = mainGame.get.card(code);
			while (card.alias !== 0 && Math.abs(card.id - card.alias) <= 20) {
				const c = mainGame.get.card(card.alias);
				if (c === mainGame.unknown)
					break;
				card = c;
			}
			return this.glist.get(card.id) ?? 0;
		}
	}
}

export default LFList;