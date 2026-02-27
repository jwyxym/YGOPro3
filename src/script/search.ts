import Card, { TYPE } from './card';
import calculator from './calculator';
import mainGame from './game';

interface AndOr {
	type : boolean;
	category : boolean;
	link : boolean;
};

class Search {
	cards ?: Array<Card>;
	ot ?: Array<number>;
	type ?: [Array<number>, Array<number>, Array<number>, Array<number>];
	attribute ?: Array<number>;
	race ?: Array<number>;
	category ?: Array<number>;
	link ?: Array<number>;
	lflist ?: string;
	forbidden ?: Array<string>;
	lv ?: Array<string>;
	atk ?: Array<string>;
	def ?: Array<string>;
	scale ?: Array<string>;
	desc ?: Array<string>;
	// ture为and，false为or
	and_or : AndOr = {
		type : false,
		category : false,
		link : false
	};

	set = {
		cards : (cards : Array<Card>) => { this.cards = cards; return this; },
		ot : (ot : Array<number>) => { this.ot = ot; return this; },
		type : (type : [Array<number>, Array<number>, Array<number>, Array<number>]) => { this.type = type; return this; },
		attribute : (attribute : Array<number>) => { this.attribute = attribute; return this; },
		category : (category : Array<number>) => { this.category = category; return this; },
		race : (race : Array<number>) => { this.race = race; return this; },
		link : (link : Array<number>) => { this.link = link; return this; },
		lflist : (lflist : string) => { this.lflist = lflist; return this; },
		forbidden : (forbidden : string) => { this.forbidden = forbidden.split('%%').filter(i => i); return this; },
		lv : (lv : string) => { this.lv = lv.split('%%').filter(i => i); return this; },
		atk : (atk : string) => { this.atk = atk.split('%%').filter(i => i); return this; },
		def : (def : string) => { this.def = def.split('%%').filter(i => i); return this; },
		scale : (scale : string) => { this.scale = scale.split('%%').filter(i => i); return this; },
		desc : (desc : string) => { this.desc = desc.split('%%').filter(i => i); return this; },
		and_or : (and_or : AndOr) => { this.and_or = and_or; return this; }
	};

	search = () : Array<Card> => {
		if (!this.cards) return [];
		const and_or = (and_or : boolean, ct : number, length : number) => and_or ? ct !== length : ct === 0;
		const compare = (i : string, num : number) => i.includes('..') ? calculator.interval(i, num) : calculator.compare(i, num);
		return this.cards.filter(card =>
			!((this.desc && this.desc.length && this.desc.filter(i => card.name.includes(i) || card.desc.includes(i) || card.id.toString() === i).length !== this.desc.length)
				|| (this.ot && this.ot.length && this.ot.findIndex(i => i.toString(2).split('1').length > 2 ? card.ot.toString(2).split('1').length > 2 : i === card.ot) === -1)
				|| (this.attribute && this.attribute.length && !this.attribute.includes(card.attribute))
				|| (this.race && this.race.length && !this.race.includes(card.race))
				|| (this.link && this.link.length && (!card.is_link() || and_or(this.and_or.link, this.link.filter(i => card.def & i).length, this.link.length)))
				|| (this.category && this.category.length && and_or(this.and_or.category, this.category.filter(i => card.category & i).length, this.category.length))
				|| (this.lv && this.lv.length && this.lv.findIndex(i => compare(i, card.level)) === -1)
				|| (this.scale && this.scale.length && this.scale.findIndex(i => compare(i, card.scale)) === -1)
				|| (this.atk && this.atk.length && this.atk.findIndex(i => compare(i.replace('?', '-1'), card.atk)) === -1)
				|| (this.def && this.def.length && this.def.findIndex(i => compare(i.replace('?', '-1'), card.def)) === -1)
				|| (this.type && this.type.length === 4 && ((this.type[0] && this.type[0].length && this.type[0].findIndex(i => card.type & i) === -1)
					|| (this.type[1] && this.type[1].length && (card.is_monster() || (this.type[1].includes(TYPE.NORMAL | TYPE.SPELL) ? this.type[2].findIndex(i => i === (TYPE.NORMAL | TYPE.SPELL) ? card.type === TYPE.SPELL || card.type === TYPE.TRAP : card.type & i) === -1
						: this.type[1].findIndex(i => card.type & i) === -1)))
					|| (this.type[2] && this.type[2].length && (!card.is_monster() || and_or(this.and_or.type, this.type[2].filter(i => card.type & i).length, this.type[2].length)))
					|| (this.type[3] && this.type[3].length && this.type[3].findIndex(i => card.type & i) > -1))
				)
			)
			|| (this.lflist && this.lflist.length && this.forbidden && this.forbidden.length && (() => {
				const ct = mainGame.get.lflist(this.lflist)?.get.lflist(card.id);
				return this.forbidden.findIndex(i => compare(i, ct)) === -1;
			})())
		);
	}
};

export default Search;