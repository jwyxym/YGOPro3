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
import TAURI_STR from './language/string';
import invoke from './tauri-api/invoke';


import voice from '@/pages/voice/voice';
import Deck from '@/pages/deck/deck';
import { LOCATION } from '@/pages/server/post/network';

class Game {
	inited = false;
	system :  Map<string, Map<string, string | number | boolean | Array<string>>> = new Map();
	textures : Map<string, Map<number, string | [string, string]>> = new Map();
	bgm : Map<string, string> = new Map();
	strings : Map<string, Map<number, string>> = new Map();
	servers : Map<string, string> = new Map();
	lflist : Map<string, LFList> = new Map;
	model : Map<string, string> = new Map();
	cards : Map<number, Card> = new Map;
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

	init = async () : Promise<void> => {
		if (this.inited) return;
		try {
			await fs.init_path();
			const startTime = Date.now();
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
			this.textures.set(CONSTANT.KEYS.LINK, new Map(textures.link));
			this.textures.set(CONSTANT.KEYS.RACE, new Map(textures.race));
			this.textures.set(CONSTANT.KEYS.TYPE, new Map(textures.types));

			this.servers = new Map(servers);
			this.lflist = new Map(lflist);
			this.model = new Map(model);
			this.bgm = new Map(sounds);
			this.cards = new Map(cards);

			this.font.url = fonts.map(([_, url]) => url);
			this.font.dom.textContent = fonts.map(([name, url]) =>
				`@font-face {
					font-family: '${name}';
					src: url('${url}');
					font-weight: normal;
					font-style: normal;
				}`
			).join('\n');
			document.head.appendChild(this.font.dom);

			console.log([fonts, sounds, textures, cards, systems, servers, lflist, strings, model, info])
				const endTime = Date.now();
				const elapsedSeconds = (endTime - startTime) / 1000;
				console.log(`运行了 ${elapsedSeconds.toFixed(3)} 秒`);
		} catch (error) {
			fs.write.log(error);
		}
		this.inited = true;
		this.unknown.update_pic(this.textures.get(CONSTANT.FILES.TEXTURE_UNKNOW) ?? '');
		this.back.update_pic(this.textures.get(CONSTANT.FILES.TEXTURE_COVER) ?? '');
	};

	reload = async () : Promise<boolean> => {
		try {
			this.clear();
			await this.load.card();
			await this.load.expansion();
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
		icon : (type : string, key : number) : string => {
			return (this.get.textures((this.icons.get(type)!.get(key) ?? '') + '.png') as string | undefined) ?? '';
		},
		text : (key : number, replace : string | number | Array<string> | Array<number> | Array<string | number> = []) : string => {
			switch (this.i18n) {
				case CONSTANT.LANGUAGE.Zh_CN:
					return new TAURI_STR(Zh_CN[key]).toString(replace);
			}
			return new TAURI_STR(Zh_CN[key]).toString();
		},
		system : (key : string) : Array<string> | string | number | boolean | undefined => {
			const value = this.system.get(key);
			const number = Number(value)
			const obj_key = Object.entries(CONSTANT.KEYS).find(([_, v]) => v === key);
			if (obj_key === undefined)
				return undefined;
			if ([
					CONSTANT.KEYS.SETTING_AVATAR,
					CONSTANT.KEYS.SETTING_LOADING_EXPANSION,
				].includes(key)
			) {
				return value?.split('&&').filter(i => i !== '') ?? [];
			} else if (key === CONSTANT.KEYS.SETTING_VOICE_BACK_BGM
				|| obj_key[0].startsWith('SETTING_CT_')
				|| obj_key[0].startsWith('SETTING_SELECT_')
			) {
				return isNaN(number) ? 0 : number;
			} else if (obj_key[0].startsWith('SETTING_CHK_')) {
				return !!number;
			} else {
				return value ?? '';
			}
		},
		textures : (key : string | Array<string>) : Array<string | undefined> | string | undefined => {
			return typeof key === 'object' ? (key as Array<string>).map(i => this.textures.get(i)) : this.textures.get(key);
		},
		card : (key : string | number) : Card => {
			key = typeof key == 'string' ? parseInt(key) : key;
			return reactive(this.cards.get(key) ?? this.unknown);
		},
		cards : () : Array<Card> => Array.from(this.cards.values()),
		expansions : async () : Promise<{
			loading : Array<string>;
			ypk :  Array<DirEntry>;
			files : Array<DirEntry>;
		}> => {
			const load_expansion : Array<string> = this.get.system(CONSTANT.KEYS.SETTING_LOADING_EXPANSION) as Array<string> ?? [];
			const expansion_files : Array<DirEntry> = await fs.read.dir(CONSTANT.DIRS.EXPANSION, false);
			const expansion_ypk : Array<DirEntry> = expansion_files.filter(i => i.isFile && i.name.match(CONSTANT.REG.ZIP));
			const load : Array<string> = load_expansion.filter(i => { return expansion_ypk.findIndex(j => j.name === i) > -1; });
			this.system.set(CONSTANT.KEYS.SETTING_LOADING_EXPANSION, load.join('&&'));
			for (let i = 0; i < load.length; i++) {
				load[i] = await fs.join(CONSTANT.DIRS.EXPANSION, load[i]);
			}
			return {
				loading : load,
				ypk : expansion_ypk,
				files : await fs.read.dir(CONSTANT.DIRS.EXPANSION)
			};
		},
		lflist : (key : string | number, card : string | number | undefined = undefined) : string | number => {
			if (typeof key === 'string' && card) {
				const lflist = this.lflist.get(key);
				if (lflist) {
					const c = this.get.card(card);
					card = Math.abs(c.alias - c.id) <= 20 ? c.alias : c.id;
					return lflist.map.get(card) ?? this.get.system(CONSTANT.KEYS.SETTING_CT_CARD) as number;
				}
				return this.get.system(CONSTANT.KEYS.SETTING_CT_CARD) as number;
			} else {
				const name = Array.from(this.lflist).find(i => i[1].hash === key) ?? [this.get.text(I18N_KEYS.UNKNOW)];
				return name[0];
			}
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
		avatar : (tp : number) : string => {
			return this.textures.get(`avatar${(this.get.system(CONSTANT.KEYS.SETTING_AVATAR) as Array<string>)[tp] ?? 0}.png`) ?? '';
		},
		counter : (counter : number) : string => {
			return this.get.textures(`counter-${counter.toString(16)}.png`) as string | undefined
				?? this.get.textures('counter-0.png') as string | undefined
					?? '';
		}
	}

	clear = () : void => {
		this.cards.forEach(i => {
			i.clear();
		});
		this.cards.clear();
		this.lflist.clear();
		this.servers.clear();
		this.strings.forEach(i => i.clear());
		this.icons.forEach(i => i.clear());
	}

	push = {
		system : (key : string, n : string | number | boolean) : void => {
			const to_string = (str : string) : string => {
				const value = this.system.get(key) ?? '';
				return `${value}${value.length > 0 ? '&&' : ''}${str}`
			}
			const obj_key = Object.entries(CONSTANT.KEYS).find(([_, v]) => v === key);
			if (obj_key === undefined)
				return undefined;
			switch (key) {
				case CONSTANT.KEYS.SETTING_LOADING_EXPANSION:
					this.system.set(key, to_string(n as string));
					break;
				case CONSTANT.KEYS.SETTING_VOICE_BACK_BGM:
					this.system.set(key, `${n ?? 0}`);
					voice.update();
					break;
				default:
					if (key.startsWith('SETTING_CT_'))
						this.system.set(key, `${n ?? 0}`);
					else if (obj_key[0].startsWith('SETTING_CHK_'))
						this.system.set(key, n ? '1' : '0');
					else
						this.system.set(key, n as string);
			}
		}
	};

	remove = {
		system : (key : string, n : string) : void => {
			const get = this.get.system(key);
			if (typeof get === 'object') {
				const ct = get.indexOf(n)
				if (ct > -1) {
					const to_string = () : string => {
						return get.filter(i => i !== n ).join('&&');
					}
					this.system.set(key, to_string());
				}
			}
		}
	};

	chk = {
		file : async () : Promise<boolean> => {
			return await fs.exists(CONSTANT.FILES.ASSETS_ZIP);
		},
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
	}
};

const mainGame = new Game();
export default mainGame;