import { reactive } from 'vue';
import { exit } from '@tauri-apps/plugin-process';
import { DirEntry } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

import fs from './fs';
import * as CONSTANT from './constant';
import Card from './card';
import LFList from './lflist';
import { I18N_KEYS } from './language/i18n';
import Zh_CN from './language/Zh-CN';
import YGOPRO_STR from './language/string';
import invoke from './tauri-api/invoke';


import voice from '@/pages/voice/voice';
import Deck from '@/pages/deck/deck';
import { LOCATION } from '@/pages/server/post/network';

class Game {
	inited = false;
	system :  Map<string, Map<string, string | number | boolean | Array<string>>> = new Map();
	textures : Map<string, Map<string | number, string | [string, string]>> = new Map();
	strings : Map<string, Map<number, string>> = new Map();
	servers : Map<string, string> = new Map();
	lflist : Map<string, LFList> = new Map;
	model : Map<string, string> = new Map();
	cards : Map<number, Card> = new Map;
	bgm : Array<[string, string]> = reactive(new Array());
	avatars : Array<string> = new Array();
	font : {
		dom : HTMLStyleElement,
		url : Array<string>
	} = {
		dom : document.createElement('style'),
		url : []
	};
	version = 0x1362;
	max_card_id = 0x0fffffff;
	max_string_id = 2047;
	i18n = CONSTANT.LANGUAGE.Zh_CN;
	unknown : Card = new Card(new Array(11).fill(0).concat(new Array(18).fill('')));
	back : Card = new Card(new Array(11).fill(0).concat(new Array(18).fill('')));

	constructor () {
		document.head.appendChild(this.font.dom);
	};

	init = async () : Promise<boolean> => {
		if (this.inited) return true;
		try {
			await invoke.game.init();
			const [fonts, sounds, textures, cards, systems, servers, lflist, strings, model, info] = await Promise.all([
				invoke.game.get_font(),
				invoke.game.get_sound(),
				invoke.game.get_textures(),
				invoke.game.get_cards(),
				invoke.game.get_system(),
				invoke.game.get_server(),
				invoke.game.get_lflist(),
				invoke.game.get_strings(),
				invoke.game.get_model(),
				invoke.game.get_info(),
			]);
			this.system.set(CONSTANT.KEYS.BOOL, new Map(systems.bool));
			this.system.set(CONSTANT.KEYS.ARRAY, new Map(systems.array));
			this.system.set(CONSTANT.KEYS.NUMBER, new Map(systems.number));
			this.system.set(CONSTANT.KEYS.STRING, new Map(systems.string));

			this.strings.set(CONSTANT.KEYS.SYSTEM, new Map(strings.system));
			this.strings.set(CONSTANT.KEYS.VICTORY, new Map(strings.victory));
			this.strings.set(CONSTANT.KEYS.COUNTER, new Map(strings.counter));
			this.strings.set(CONSTANT.KEYS.SETCODE, new Map(strings.setname));
			this.strings.set(CONSTANT.KEYS.OT, new Map(info.ot));
			this.strings.set(CONSTANT.KEYS.ATTRIBUTE, new Map(info.attribute));
			this.strings.set(CONSTANT.KEYS.CATEGORY, new Map(info.category));
			this.strings.set(CONSTANT.KEYS.LINK, new Map(info.link));
			this.strings.set(CONSTANT.KEYS.RACE, new Map(info.race));
			this.strings.set(CONSTANT.KEYS.TYPE, new Map(info.types));

			this.textures.set(CONSTANT.KEYS.OT, new Map(textures.ot));
			this.textures.set(CONSTANT.KEYS.ATTRIBUTE, new Map(textures.attribute));
			this.textures.set(CONSTANT.KEYS.CATEGORY, new Map(textures.category));
			this.textures.set(CONSTANT.KEYS.RACE, new Map(textures.race));
			this.textures.set(CONSTANT.KEYS.TYPE, new Map(textures.types));
			this.textures.set(CONSTANT.KEYS.LINK, new Map(textures.link));
			this.textures.set(CONSTANT.KEYS.COUNTER, new Map(textures.counter));
			this.textures.set(CONSTANT.KEYS.INFO, new Map(textures.info));
			this.textures.set(CONSTANT.KEYS.OTHER, new Map(textures.other));
			this.textures.set(CONSTANT.KEYS.BTN, new Map(textures.btn));

			this.avatars = textures.avatar;
			this.servers = new Map(servers);
			this.lflist = new Map(lflist);
			this.lflist.set(CONSTANT.KEYS.NA, new LFList(this.get.text(I18N_KEYS.LFLIST_NA), { hash : 0x7dfcee6a, genesys : 0, lflist : [], glist : [] }));
			this.model = new Map(model);
			this.bgm.push(...sounds);
			this.cards = new Map(cards.map(i => [i[0], reactive(i[1])]));

			this.font.url = fonts.map(([_, url]) => url);
			this.font.dom.textContent = fonts.map(([name, url]) =>
				`@font-face {
					font-family: '${name}';
					src: url('${url}');
					font-weight: normal;
					font-style: normal;
				}`
			).join('\n');
			this.inited = true;
			this.unknown
				.update_pic(this.textures.get(CONSTANT.KEYS.OTHER)!.get(CONSTANT.KEYS.UNKNOWN) as string ?? '')
				.set.readonly();
			this.back
				.update_pic(this.textures.get(CONSTANT.KEYS.OTHER)!.get(CONSTANT.KEYS.COVER) as string ?? '')
				.set.readonly();
			return true;
		} catch (error) {
			fs.write.log(error);
			return false;
		}
	};

	reload = async (overwrite : boolean) : Promise<boolean> => {
		try {
			await Promise.all([
				this.clear(),
				await invoke.game.reload(overwrite)
			]);
			await this.init();
			return true;
		} catch (error) {
			fs.write.log(error);
		}
		return false;
	};

	replace = (value : string, replace : Array<string | number> | string | number) : string => {
		replace = typeof replace === 'object' ? replace : [replace];
		for (const str of replace) {
			value = value.replace(typeof str === 'string' ? '%ls' : '%d', `${str}`);
		}
		return value;
	};

	get = {
		textures : (type : string, key : string | number) : [string, string] | string => this.textures.get(type)?.get(key) ?? '',
		lflist : (key : string | number) : LFList => (typeof key === 'string'
				? this.lflist.get(key) : Array.from(this.lflist).find(i => i[1].hash === key)?.[1]
			)
			?? this.lflist.get(CONSTANT.KEYS.NA)!,
		// expansions : invoke.game.get_expansion,
		text : (key : number, replace : string | number | Array<string> | Array<number> | Array<string | number> = []) : string => {
			switch (this.i18n) {
				case CONSTANT.LANGUAGE.Zh_CN:
					return new YGOPRO_STR(Zh_CN[key]).toString(replace);
			}
			return new YGOPRO_STR(Zh_CN[key]).toString();
		},
		system : (key : string) : Array<string> | string | number | boolean | undefined => {
			for (const i of this.system)
				if (i[1].has(key))
					return i[1].get(key);
			return undefined;
		},
		card : (key : string | number) : Card => {
			key = typeof key == 'string' ? parseInt(key) : key;
			return this.cards.get(key) ?? this.unknown;
		},
		strings : {
			system : (key : number, replace : Array<string | number> | string | number = []) : string => {
				const value = this.strings.get(CONSTANT.KEYS.SYSTEM)!.get(key) ?? this.get.text(I18N_KEYS.UNKNOW);
				return this.replace(value, replace);
			},
			victory : (key : number, replace : Array<string | number> | string | number = []) : string => {
				let value = this.strings.get(CONSTANT.KEYS.VICTORY)!.get(key) ?? this.get.text(I18N_KEYS.UNKNOW);
				replace = typeof replace === 'object' ? replace : [replace];
				for (const str of replace) {
					value = value.replace(typeof str === 'string' ? '%ls' : '%d', `${str}`);
				}
				return value;
			},
			race : (data : number) : string => {
				return Array.from(this.strings.get(CONSTANT.KEYS.RACE)!)
					.filter(i => Math.abs(i[0] & data) === i[0])
					.map(i => i[1])
					.join('|');
			},
			attribute : (data : number) : string => {
				return Array.from(this.strings.get(CONSTANT.KEYS.ATTRIBUTE)!)
					.filter(i => Math.abs(i[0] & data) === i[0])
					.map(i => i[1])
					.join('|');
			},
			ot : (data : number) : string => {
				return this.strings.get(CONSTANT.KEYS.OT)!
					.get(data) ?? '';
			},
			type : (data : number) : string => {
				return Array.from(this.strings.get(CONSTANT.KEYS.TYPE)!)
					.filter(i => ![0x81, 0x82].includes(i[0]) && Math.abs(i[0] & data) === i[0])
					.map(i => i[1])
					.join('|');
			},
			category : (data : number) : string => {
				return Array.from(this.strings.get(CONSTANT.KEYS.CATEGORY)!)
					.filter(i => Math.abs(i[0] & data) === i[0])
					.map(i => i[1])
					.join('|');
			},
			link : (data : number) : string => {
				return Array.from(this.strings.get(CONSTANT.KEYS.LINK)!)
					.filter(i => Math.abs(i[0] & data) === i[0])
					.map(i => i[1])
					.join('|');
			},
			setcode : (i : number) : string => {
				return this.strings.get(CONSTANT.KEYS.SETCODE)?.get(i) ?? `0x${i.toString(16)}`;
			}
		},
		desc : (data : number, replace : Array<string | number> | string | number = []) : string => {
			if (data <= this.max_string_id)
				return this.get.strings.system(data, replace);
			const code = (data >> 4) & this.max_card_id;
			const offset = data & 0xf;
			const card =  mainGame.get.card(code);
			return card === this.unknown ? this.get.text(I18N_KEYS.UNKNOW)
				: this.replace(card.hint[offset], replace);
		},
		location : (loc : number, seq : number) : string => {
			if (loc === LOCATION.SZONE)
				return this.get.strings.system(seq < 5 ? 1003 : seq === 5 ? 1008 : 1009);
			return this.get.strings.system(1000 + Object.entries(LOCATION).findIndex((_, i) => i === loc));
		},
		name : (id : number | undefined) : string => {
			if (id === undefined)
				return this.get.text(I18N_KEYS.UNKNOW);
			const card = mainGame.get.card(id);
			return card === this.unknown ? this.get.text(I18N_KEYS.UNKNOW) : card.name;
		},
		avatar : (tp : number) : string => this.avatars[this.get.system(!!tp ? CONSTANT.KEYS.SETTING_AVATAR_OPPO : CONSTANT.KEYS.SETTING_AVATAR_SELF) as number],
		counter : (counter : number) : string => {
			return this.get.textures(CONSTANT.KEYS.COUNTER, counter) as string | undefined
				?? this.get.textures(CONSTANT.KEYS.COUNTER, 0) as string;
		}
	};

	clear = () : void => {
		this.cards.forEach(i => {
			i.clear();
		});
		this.font.url.forEach(i => URL.revokeObjectURL(i));
		this.font.url.length = 0;
		this.font.dom.textContent = '';
		this.bgm.forEach((i) => URL.revokeObjectURL(i[1]));
		this.bgm.length = 0;
	};

	load = {
		deck : invoke.game.get_deck,
		pic : async (deck : Deck | Array<number | string>) => {
			if (deck instanceof Deck) deck = deck.main.concat(deck.side, deck.extra);
			deck = deck
				.filter(i => !this.get.card(i).has_pic())
				.map(i => typeof i === 'string' ? parseInt(i) : i);
			(await invoke.game.get_pic(deck as Array<number>))
				.forEach(i => this.get.card(i[0]).update_pic(i[1]));
		}
	}

	chk = {
		file : invoke.game.exists,
		version : {
			game : async () : Promise<boolean> => {
				const time = await invoke.network.version(CONSTANT.URL.VERSION, CONSTANT.URL.VERSION_HEAD);
				const local = this.get.system(CONSTANT.KEYS.SETTING_DOWMLOAD_TIME);
				if (time.error === undefined && typeof local === 'string') {
					return new Date(time.content!) <= new Date(local);
				} else if (local === undefined)
					return true;
				return false;
			},
			superpre : async () : Promise<boolean> => {
				const time = await fetch(CONSTANT.URL.SUPER_PRE_VERSION, {
					method: 'GET',
				});
				if (time.ok) {
					const date = new Date(Number((await time.text()).trim()) * 1000);
					const p = await fs.join(CONSTANT.DIRS.EXPANSION, CONSTANT.FILES.SUPER_PRE)
					if (await fs.exists(p)) {
						const local = await fs.read.time(p);
						if (local)
							return new Date(local) >= date;
					}
					return true;
				}
				return false;
			},
		}
	}

	exit = async () : Promise<void> => {
		return await exit(1);
	};

	sleep = async (time : number, func : Function = () => {}, para : Array<any> = []) : Promise<void> => {
		const data = Date.now();
		await func(...para);
		return new Promise(resolve => setTimeout(resolve, Math.max(0, time - (Date.now() - data))));
	};

	download = invoke.game.download;
};

const mainGame = new Game();
export default mainGame;