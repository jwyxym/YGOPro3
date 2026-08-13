import mainGame from './game';

const TYPE = {
	MONSTER : 0x1,
	SPELL : 0x2,
	TRAP : 0x4,
	NORMAL : 0x10,
	EFFECT : 0x20,
	FUSION : 0x40,
	RITUAL : 0x80,
	TRAPMONSTER : 0x100,
	SPIRIT : 0x200,
	UNION : 0x400,
	DUAL : 0x800,
	TUNER : 0x1000,
	SYNCHRO : 0x2000,
	TOKEN : 0x4000,
	QUICKPLAY : 0x10000,
	CONTINUOUS : 0x20000,
	EQUIP : 0x40000,
	FIELD : 0x80000,
	COUNTER : 0x100000,
	FLIP : 0x200000,
	TOON : 0x400000,
	XYZ : 0x800000,
	PENDULUM : 0x1000000,
	SPSUMMON : 0x2000000,
	LINK : 0x4000000
}

class Card {
	ot : number;
	id : number;
	alias : number;
	level : number;
	scale : number;
	atk : number;
	def : number;
	type : number;
	race : number;
	attribute : number;
	category : number;
	setcode : Array<number>;
	name : string;
	desc : string;
	hint : Array<string>;
	pic : string;
  
	constructor (i : {
		name : string;
		desc : string;
		hint : Array<string>;
		code : number;
		alias : number;
		setcode : Array<number>;
		card_type : number;
		level : number;
		attribute : number;
		race : number;
		attack : number;
		defense : number;
		lscale : number;
		rscale : number;
		link_marker : number;
		ot : number;
		category : number;
	}) {
		this.pic = '';
		this.id = i.code;
		this.ot = i.ot;
		this.alias = i.alias;
		this.setcode = i.setcode;
		this.type = i.card_type;
		this.atk = i.attack;
		this.def = i.defense;
		this.level = i.level;
		this.scale = i.rscale;
		this.race = i.race;
		this.attribute = i.attribute;
		this.category = i.category;
		this.name = i.name;
		this.desc = i.desc;
		this.hint = i.hint;
	};

	static default = () : Card => new Card({
		name : '',
		desc : '',
		hint : [],
		setcode : [],
		code : 0,
		alias : 0,
		card_type : 0,
		level : 0,
		attribute : 0,
		race : 0,
		attack : 0,
		defense : 0,
		lscale : 0,
		rscale : 0,
		link_marker : 0,
		ot : 0,
		category : 0
	});

	update_pic = (url : string) : Card => {
		this.clear();
		this.pic = url;
		return this;
	};

	clear = () : void => {
		if (this.pic.startsWith('blob:http'))
			URL.revokeObjectURL(this.pic);
	};

	has_pic = () : boolean => {
		return this.pic !== '' && this.pic !== mainGame.unknown.pic;
	};

	is_link = () : boolean => {
		return (this.type & TYPE.LINK) === TYPE.LINK;
	};

	is_pendulum = () : boolean => {
		return (this.type & TYPE.PENDULUM) === TYPE.PENDULUM;
	};

	is_xyz = () : boolean => {
		return (this.type & TYPE.XYZ) === TYPE.XYZ;
	};

	is_monster = () : boolean => {
		return (this.type & TYPE.MONSTER) === TYPE.MONSTER;
	};

	is_spell = () : boolean => {
		return (this.type & TYPE.SPELL) === TYPE.SPELL;
	};

	is_trap = () : boolean => {
		return (this.type & TYPE.TRAP) === TYPE.TRAP;
	};

	is_ex = () : boolean => {
		return (this.type & (TYPE.FUSION | TYPE.SYNCHRO | TYPE.XYZ | TYPE.LINK)) > 0;
	};

	is_token = () : boolean => {
		return (this.type & TYPE.TOKEN) === TYPE.TOKEN;
	};

	is_tuner = () : boolean => {
		return (this.type & TYPE.TUNER) === TYPE.TUNER;
	};

}

export default Card;
export { TYPE };
