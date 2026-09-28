import * as toml from 'smol-toml';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { YGOProCdb } from 'ygopro-cdb-encode';

import Deck from '@/pages/deck/deck';
import { toast } from '@/pages/toast/toast';
import Card from '@/script/card';
import LFList from '@/script/lflist';
import db from '@/script/db';
import * as CONSTANT from '@/script/constant';
import http from '@/script/http';
import BaseInvoke from './base';

const SQL = await initSqlJs({
	locateFile : () => wasmUrl
});

class Invoke extends BaseInvoke {
	game = {
		init : async () : Promise<boolean> => true,
		reload : async () : Promise<boolean> => true,
		time : async () : Promise<Date | undefined> => undefined,
		version : async () : Promise<string> => '',
		chk_version : async () : Promise<boolean> => false,
		download : async () : Promise<string> => '',
		set_system : async (key : string, ct : number, value : string | number | boolean | Array<string>) : Promise<boolean> => {
			try {
				switch (ct) {
					case 0:
						await db.system.string.set(key, value as string);
						break;
					case 1:
						await db.system.bool.set(key, value as boolean);
						break;
					case 2:
						await db.system.number.set(key, value as number);
						break;
					case 3:
						await db.system.array.set(key, value as Array<string>);
						break;
				}
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		set_textures : async (key : string, _ : string, content ?: Uint8Array) : Promise<boolean> => {
			if (!content)
				return false;
			try {
				return Boolean(await db.textures.set(
					key,
					new Blob(
						[content as Uint8Array<ArrayBuffer>],
						{ type : 'image/png' }
					))
				);
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		get_srv : async (url : string) : Promise<string> => url,
		get_pic : async (deck : Array<number>) : Promise<Array<[number, string]>> => {
			try {
				return deck.map(i => [i,
					Math.floor(Math.log10(Math.abs(i))) < 8
						? `https://cdn.233.momobako.com/ygopro/pics/${i}.jpg!half`
						: `https://cdn02.moecube.com:444/ygopro-super-pre/data/pics/${i}.jpg`
				]);
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_sound : async () : Promise<Array<[string, string]>> => {
			try {
				const i : string = await http.get<string>('./config/resource.toml', 'text');
				const data = toml.parse(i);
				const path = (value : string) : string => value ? `./sound/${value}` : '';
				return Object.entries(data.sound).map(i => [i[0], path(i[1] as string)]);
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_textures : async () : Promise<{
			ot : Map<number, string>,
			attribute : Map<number, string>,
			category : Map<number, string>,
			race : Map<number, string>,
			types : Map<number, string>,
			counter : Map<number, string>,
			link : Map<number, [string, string]>,
			info : Map<string, string>,
			other : Map<string, string>,
			btn : Map<string, [string, string]>,
			avatar : Array<string>,
		}> => {
			try {
				const [i, b] = await Promise.all([
					http.get<string>('./config/resource.toml', 'text'),
					db.textures.get_all()
				]);
				const data = toml.parse(i);
				const path = (value : string) : string => value ? `./textures/${value}` : '';
				const other = new Map(Object.entries(data.other).map(i => [i[0], path(i[1] as string)]));
				const back = new Map(b);
				const back_i = back.get(CONSTANT.KEYS.BACKI);
				const back_ii = back.get(CONSTANT.KEYS.BACKII);
				if (back_i)
					other.set(CONSTANT.KEYS.BACKI, URL.createObjectURL(back_i));
				if (back_ii)
					other.set(CONSTANT.KEYS.BACKII, URL.createObjectURL(back_ii));
				return {
					ot : new Map(Object.entries(data.ot).map(i => [Number(i[0]), path(i[1] as string)])),
					attribute : new Map(Object.entries(data.attribute).map(i => [Number(i[0]), path(i[1] as string)])),
					link : new Map(Object.entries(data.link).map(i => [
						Number(i[0]),
						(i[1] as [string, string]).map(path) as [string, string]
					])),
					category : new Map(Object.entries(data.category).map(i => [Number(i[0]), path(i[1] as string)])),
					race : new Map(Object.entries(data.race).map(i => [Number(i[0]), path(i[1] as string)])),
					types : new Map(Object.entries(data.types).map(i => [Number(i[0]), path(i[1] as string)])),
					counter : new Map(Object.entries(data.counter).map(i => [Number(i[0]), path(i[1] as string)])),
					info : new Map(Object.entries(data.info).map(i => [i[0], path(i[1] as string)])),
					btn : new Map(Object.entries(data.btn).map(i => [
						i[0],
						(i[1] as [string, string]).map(path) as [string, string]
					])),
					avatar : ((data.avatar as any).AVATAR as string[]).map(path),
					other
				};
			} catch (error) {
				await this.log.write(error);
				return {
					ot : new Map(),
					attribute : new Map(),
					link : new Map(),
					category : new Map(),
					race : new Map(),
					types : new Map(),
					counter : new Map(),
					info : new Map(),
					other : new Map(),
					btn : new Map(),
					avatar : []
				};
			}
		},
		get_cards : async () : Promise<Array<[number, Card]>> => {
			try {
				const [db, pre_db] = await Promise.all([
					http.get<ArrayBuffer>(CONSTANT.URL.CDB, 'arrayBuffer'),
					http.get<ArrayBuffer>(CONSTANT.URL.PRE_CDB, 'arrayBuffer')
				]);
				const cdb = new YGOProCdb(SQL)
					.from(new Uint8Array(db));
				const pre_cdb = new YGOProCdb(SQL)
					.from(new Uint8Array(pre_db));
				const cards = cdb.find().concat(pre_cdb.find());
				return cards.map(c => [c.code, new Card({
					name : c.name,
					desc : c.desc,
					hint : c.strings,
					code : c.code,
					alias : c.alias,
					setcode : c.setcode,
					card_type : c.type,
					level : c.level,
					attribute : c.attribute,
					race : c.race,
					attack : c.attack,
					defense : c.defense,
					lscale : c.lscale,
					rscale : c.rscale,
					link : c.linkMarker,
					ot : c.ot,
					category : c.category
				})]);
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_system : async () : Promise<{
			string : Map<string, string>,
			bool : Map<string, boolean>,
			number : Map<string, number>,
			array : Map<string, Array<string>>,
		}> => {
			try {
				const i = await Promise.all([
					db.system.string.get_all(),
					db.system.bool.get_all(),
					db.system.number.get_all(),
					db.system.array.get_all(),
				]);
				const string = new Map(i[0]);
				const bool = new Map(i[1]);
				const number = new Map(i[2]);
				const array = new Map(i[3]);
				[
					CONSTANT.KEYS.SETTING_LOADING_EXPANSION,
					CONSTANT.KEYS.SETTING_EXTEND,
					CONSTANT.KEYS.SETTING_DGLAB_WAVEFORM,
				]
					.forEach(i => {
						if (!array.has(i))
							array.set(i, []);
					});
				[
					CONSTANT.KEYS.SETTING_CHK_HIDDEN_NAME,
					CONSTANT.KEYS.SETTING_CHK_HIDDEN_CHAT,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_GET,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_POST,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_PUT,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_PATCH,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_DELETE,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_HEAD,
					CONSTANT.KEYS.SETTING_CHK_PLUGIN_OPTIONS
				]
					.forEach(i => {
						if (!bool.has(i))
							bool.set(i, false);
					});
				[
					CONSTANT.KEYS.SETTING_CHK_DELETE_YPK,
					CONSTANT.KEYS.SETTING_CHK_DELETE_REPLAY,
					CONSTANT.KEYS.SETTING_CHK_DELETE_DECK,
					CONSTANT.KEYS.SETTING_CHK_EXIT_DECK,
					CONSTANT.KEYS.SETTING_CHK_SWAP_BUTTON,
					CONSTANT.KEYS.SETTING_CHK_SORT_DECK,
					CONSTANT.KEYS.SETTING_CHK_DISRUPT_DECK,
					CONSTANT.KEYS.SETTING_CHK_CLEAR_DECK,
					CONSTANT.KEYS.SETTING_CHK_EXIT_SERVER,
					CONSTANT.KEYS.SETTING_CHK_SURRENDER,
					CONSTANT.KEYS.SETTING_CHK_DGLAB_SCRIPT
				]
					.forEach(i => {
						if (!bool.has(i))
							bool.set(i, true);
					});
				([
					[CONSTANT.KEYS.SETTING_VOICE_SOUND_EFFECT, 0.2],
					[CONSTANT.KEYS.SETTING_VOICE_BGM, 0.2],
					[CONSTANT.KEYS.SETTING_FRAME, 60],
					[CONSTANT.KEYS.SETTING_CT_CARD, 3],
					[CONSTANT.KEYS.SETTING_CT_DECK_MAIN, 60],
					[CONSTANT.KEYS.SETTING_CT_DECK_EX, 15],
					[CONSTANT.KEYS.SETTING_CT_DECK_SIDE, 15],
					[CONSTANT.KEYS.SETTING_CT_DOWNLOADCHUNKS_RETRIES, 8],
					[CONSTANT.KEYS.SETTING_DGLAB_MIN_TIME, 1],
					[CONSTANT.KEYS.SETTING_DGLAB_MAX_TIME, 4],
					[CONSTANT.KEYS.SETTING_DGLAB_RATIO_TIME, 2000],
					[CONSTANT.KEYS.SETTING_DGLAB_MIN_INTENSITY, 10],
					[CONSTANT.KEYS.SETTING_DGLAB_MAX_INTENSITY, 40],
					[CONSTANT.KEYS.SETTING_DGLAB_RATIO_INTENSITY, 200],
					[CONSTANT.KEYS.SETTING_CT_DECK_PRELINE, 10],
					[CONSTANT.KEYS.SETTING_CT_SIDE_PRELINE, 15],
					[CONSTANT.KEYS.SETTING_CT_ABOUT_PRELINE, 10],
					[CONSTANT.KEYS.SETTING_AVATAR_SELF, 0],
					[CONSTANT.KEYS.SETTING_AVATAR_OPPO, 0],
					[CONSTANT.KEYS.SETTING_AVATAR_SERVER, 0],
					[CONSTANT.KEYS.SETTING_AVATAR_WATCHER, 0],
				] as Array<[string, number]>)
					.forEach(i => {
						if (!number.has(i[0]))
							number.set(i[0], i[1]);
					});
				([
					[CONSTANT.KEYS.SETTING_SERVER_PLAYER_NAME, ''],
					[CONSTANT.KEYS.SETTING_SERVER_ADDRESS, ''],
					[CONSTANT.KEYS.SETTING_SERVER_PASS, ''],
					[CONSTANT.KEYS.SETTING_DGLAB_SERVER, ''],
					[CONSTANT.KEYS.SETTING_SEARCH_SPLIT, '%%'],
					[CONSTANT.KEYS.I18N, 'zh-CN'],
				] as Array<[string, string]>)
					.forEach(i => {
						if (!string.has(i[0]))
							string.set(i[0], i[1]);
					});
				if (string.get(CONSTANT.KEYS.SETTING_SEARCH_SPLIT) === '')
					string.set(CONSTANT.KEYS.SETTING_SEARCH_SPLIT, '%%');
				if (!['zh-CN', 'ko-KR', 'ja-JP', 'en-US', 'zh-TW'].includes(string.get(CONSTANT.KEYS.I18N)!))
					string.set(CONSTANT.KEYS.I18N, 'zh-CN');

				const write = <T>(
					values : Map<string, T>,
					stored : Array<[string, T]>,
					set : (key : string, value : T) => Promise<IDBValidKey>
				) : Array<Promise<IDBValidKey>> => {
					const previous = new Map(stored);
					return Array.from(values)
						.filter(([key, value]) => !previous.has(key) || previous.get(key) !== value)
						.map(([key, value]) => set(key, value));
				};
				await Promise.all([
					...write(string, i[0], db.system.string.set),
					...write(bool, i[1], db.system.bool.set),
					...write(number, i[2], db.system.number.set),
					...write(array, i[3], db.system.array.set),
				]);

				return {
					string,
					bool,
					number,
					array
				};
			} catch (error) {
				await this.log.write(error);
				return {
					string : new Map(),
					bool : new Map(),
					number : new Map(),
					array : new Map()
				};
			}
		},
		get_server : async () : Promise<Array<[string, string]>> => {
			try {
				const i : string = await http.get<string>('./config/servers.toml', 'text');
				return Object.entries(toml.parse(i)) as any;
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_lflist : async () : Promise<Array<[string, LFList]>> => {
			try {
				return [];
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_strings : async () : Promise<{
			system : Array<[number, string]>,
			victory : Array<[number, string]>,
			counter : Array<[number, string]>,
			setname : Array<[number, string]>,
		}> => {
			try {
				return {
					system : [],
					victory : [],
					counter : [],
					setname : []
				};
			} catch (error) {
				await this.log.write(error);
				return {
					system : [],
					victory : [],
					counter : [],
					setname : []
				};
			}
		},
		get_info : async () : Promise<{
			ot : Array<[number, string]>,
			attribute : Array<[number, string]>,
			link : Array<[number, string]>,
			category : Array<[number, string]>,
			race : Array<[number, string]>,
			types : Array<[number, string]>
		}> => {
			try {
				return {
					ot : [],
					attribute : [],
					link : [],
					category : [],
					race : [],
					types : []
				};
			} catch (error) {
				await this.log.write(error);
				return {
					ot : [],
					attribute : [],
					link : [],
					category : [],
					race : [],
					types : []
				};
			}
		},
		get_room : async () : Promise<Array<[string, string]>> => {
			try {
				return [
					['T', '双打'],
					['S', '单局'],
					['M', '三局'],
					['TM0', '不限时长'],
					['NF', '无禁限'],
					['NS', '不洗牌'],
					['NC', '不检查卡组'],
					['TO', '仅TCG'],
					['TLP4000', '4000基本分'],
					['ST8', '8张起手'],
					['DR', '每轮抽2']
				];
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_script : async (id : number) : Promise<string> => {
			try {
				return '';
			} catch (error) {
				await this.log.write(error);
				return '';
			}
		},
		get_hash : async () : Promise<ArrayBuffer | undefined> => {
			try {
				return undefined;
			} catch (error) {
				await this.log.write(error);
				return undefined;
			}
		}
	};
	deck = {
		get : async () : Promise<Array<Deck>> => {
			try {
				return await db.deck.get_all();
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		write : async (name : string, deck : string) : Promise<boolean> => {
			try {
				await db.deck.set(Deck.fromYdkString(deck).set_name(name));
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		rename : async (old_name : string, new_name : string) : Promise<boolean> => {
			try {
				const deck = await db.deck.get(old_name);
				deck.name = new_name;
				await db.deck.del(old_name);
				await db.deck.set(deck);
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		del : async (name : string) : Promise<boolean> => {
			try {
				await db.deck.del(name);
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		}
	};
	ypk = {
		del : async () => false,
		exists : async () => false,
		get : async () : Promise<Array<string>> => [],
		load : async (name ?: string) : Promise<boolean | Array<string>> => name ? false : [],
		unload : async () => true
	};
	server = {
		start : async () => 0,
		stop : async () => false
	};
	bot = {
		start : async () => undefined,
		stop : async () => false,
		list : async () => []
	};
	replay = {
		read : async (name : string | Blob) : Promise<Uint8Array> => {
			try {
				name = name as Blob;
				return new Uint8Array();
			} catch (error) {
				await this.log.write(error);
				return new Uint8Array();
			}
		},
		save : async (name : string, content : Uint8Array) : Promise<string | void> => {
			try {
				
			} catch (error) {
				await this.log.write(error);
			}
		},
		list : async () => [],
		rename : async () => true,
		del : async () => true
	};
	js = {
		load : async () =>undefined,
		unload : async () => false,
		call : async () => undefined
	};
	plugin = {
		write : async () => false,
		read : async () => ''
	};
	log = {
		write : async (line : string) : Promise<boolean> => {
			toast.error(line);
			console.error(line);
			return true;
		}
	};
};

const invoke = new Invoke();
export default invoke;
