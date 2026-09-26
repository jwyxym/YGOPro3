import Deck from '@/pages/deck/deck';
import { toast } from '@/pages/toast/toast';
import Card from '@/script/card';
import LFList from '@/script/lflist';
import BaseInvoke from './base';

class Invoke extends BaseInvoke {
	game = {
		init : async () : Promise<boolean> => true,
		reload : async () : Promise<boolean> => true,
		time : async () : Promise<Date | undefined> => undefined,
		version : async () : Promise<string> => '',
		chk_version : async () : Promise<boolean> => false,
		download : async () : Promise<string> => '',
		set_system : async (key : string, ct : number, value : string | number | boolean | Array<string>, write : boolean) : Promise<boolean> => {
			try {
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		set_textures : async (key : string, value : string, content ?: Uint8Array) : Promise<boolean> => false,
		get_srv : async (url : string) : Promise<string> => url,
		get_pic : async (deck : Array<number>) : Promise<Array<[number, string]>> => {
			try {
				return [];
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_sound : async () : Promise<Array<[string, string]>> => {
			try {
				return [];
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_textures : async () : Promise<{
			ot : Array<[number, string]>,
			attribute : Array<[number, string]>,
			category : Array<[number, string]>,
			race : Array<[number, string]>,
			types : Array<[number, string]>,
			counter : Array<[number, string]>,
			link : Array<[number, [string, string]]>,
			info : Array<[string, string]>,
			other : Array<[string, string]>,
			btn : Array<[string, [string, string]]>,
			avatar : Array<string>,
		}> => {
			try {
				return {
					ot : [],
					attribute : [],
					link : [],
					category : [],
					race : [],
					types : [],
					counter : [],
					info : [],
					other : [],
					btn : [],
					avatar : []
				};
			} catch (error) {
				await this.log.write(error);
				return {
					ot : [],
					attribute : [],
					link : [],
					category : [],
					race : [],
					types : [],
					counter : [],
					info : [],
					other : [],
					btn : [],
					avatar : []
				};
			}
		},
		get_cards : async () : Promise<Array<[number, Card]>> => {
			try {
				return [];
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_system : async () : Promise<{
			string : Array<[string, string]>,
			bool : Array<[string, boolean]>,
			number : Array<[string, number]>,
			array : Array<[string, Array<string>]>,
		}> => {
			try {
				return {
					string : [],
					bool : [],
					number : [],
					array : []
				}
			} catch (error) {
				await this.log.write(error);
				return {
					string : [],
					bool : [],
					number : [],
					array : []
				};
			}
		},
		get_server : async () : Promise<Array<[string, string]>> => [
			['wss://ygopro3.cn/ws', 'YGOPro3服'],
			['koishi.momobako.com:7210', 'Koishi 主服'],
			['koishi.momobako.com:7373', 'Koishi DL 服'],
			['koishi.momobako.com:2337', 'Koishi 无禁服'],
			['dc.momobako.com:2333', '决斗编年史'],
			['s1.ygo233.com:233', '233 服'],
			['s2.ygo233.com:233', '233 服 2 区'],
			['s1.ygo233.com:2333', '2333 约战服']
		],
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
		get : async () : Promise<Array<Deck>> => [],
		write : async () => true,
		rename : async () => true,
		del : async () => true
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
			return true;
		}
	};
};

const invoke = new Invoke();
export default invoke;