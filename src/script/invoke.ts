import { invoke } from '@tauri-apps/api/core';
import * as bincode from 'bincode-ts';
import Deck from '@/pages/deck/deck';
import fs from './fs';
import Card from './card';
import LFList from './lflist';

interface Srv {
	priority : number;
	weight : number;
	port : number;
	target : string;
};

class Invoke {
	game = {
		init : async () : Promise<boolean> => {
			try {
				await invoke<void>('init');
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		reload : async (overwrite : boolean) : Promise<boolean> => {
			try {
				await invoke<void>('reload', { overwrite : overwrite });
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		time : async (path : Array<string>) : Promise<Date | undefined> => {
			try {
				const time = await invoke<string>('get_time', { path : path });
				return time.length > 0 ? new Date(time) : undefined;
			} catch (error) {
				fs.write.log(error);
				return undefined;
			}
		},
		chk_version : async () : Promise<[boolean, boolean]> => {
			try {
				return await invoke<[boolean, boolean]>('chk_version');
			} catch (error) {
				fs.write.log(error);
				return [true, true];
			}
		},
		download : async (url ?: string, name ?: string) : Promise<string | undefined> => {
			try {
				return await (url ? invoke<string>('download', { url : url, name : name ?? ''})
					: invoke<void>('download_assets')) ?? undefined;
			} catch (error) {
				fs.write.log(error);
				return undefined;
			}
		},
		get_ypk : async () : Promise<Array<string>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_ypk');
				return bincode.decode(
					bincode.Collection(bincode.String), result
				).value as Array<string>;
			} catch (error) {
				fs.write.log(error);
				return [];
			}
		},
		load_ypk : async (name ?: string) : Promise<boolean | Array<string>> => {
			try {
				if (name) {
					await invoke<void>('load_ypk', { name : name });
					return true;
				} else return await this.game.get_ypk();
			} catch (error) {
				fs.write.log(error);
				return name ? false : [];
			}
		},
		unload_ypk : async (name : string) : Promise<boolean> => {
			try {
				await invoke<void>('unload_ypk', { name : name });
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		set_system : async (key : string, ct : number, value : string | number | boolean | Array<string>, write : boolean) : Promise<boolean> => {
			try {
				await invoke<void>('set_system', { key : key, ct : ct, value : JSON.stringify(value), write : write });
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		get_srv : async (url : string) : Promise<string> => {
			try {
				const result = await invoke<Srv>('get_srv', { url : url });
				return result.target + ':' + result.port;
			} catch (error) {
				fs.write.log(error);
				return url;
			}
		},
		get_pic : async (deck : Array<number>) : Promise<Array<[number, string]>> => {
			try {
				if (!deck.length) return [];
				const result = await invoke<ArrayBuffer>('get_pic', { deck : deck });
				const pics : [Array<[number, string]>, Array<[number, Array<number>]>] = bincode.decode(bincode.Tuple(
					bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					bincode.Collection(bincode.Tuple(bincode.u32, bincode.Collection(bincode.u8)))
				), result).value as [Array<[number, string]>, Array<[number, Array<number>]>];
				const jpeg_header = [255, 216, 255, 224, 0, 16, 74, 70];
				const buffer_url : Array<[number, string]> = pics[1].map(i =>[i[0], URL.createObjectURL(new Blob([new Uint8Array(i[1])], {
					type : i[1].slice(0, 8).every((v, i) => jpeg_header[i] === v) ? 'image/jpeg' : 'image/png'
				}))]);
				return [pics[0], buffer_url].flat();
			} catch (error) {
				fs.write.log(error);
				return [];
			}
		},
		get_font : async () : Promise<Array<[string, string]>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_font');
				const fonts : Array<[string, Array<number>]> = bincode.decode(
					bincode.Collection(bincode.Tuple(bincode.String, bincode.Collection(bincode.u8))), result
				).value as Array<[string, Array<number>]>;
				return fonts.map(i =>[i[0], URL.createObjectURL(new Blob([new Uint8Array(i[1])], {
					type : 'application/x-font-ttf'
				}))]);
			} catch (error) {
				fs.write.log(error);
				return [];
			}
		},
		get_sound : async () : Promise<Array<[string, string]>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_sound');
				const fonts : Array<[string, Array<number>]> = bincode.decode(
					bincode.Collection(bincode.Tuple(bincode.String, bincode.Collection(bincode.u8))), result
				).value as Array<[string, Array<number>]>;
				return fonts.map(i =>[i[0], URL.createObjectURL(new Blob([new Uint8Array(i[1])], {
					type : 'audio/mp3'
				}))]);
			} catch (error) {
				fs.write.log(error);
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
				const result = await invoke<ArrayBuffer>('get_textures');
				return bincode.decode(bincode.Struct({
					ot : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					attribute : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					category : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					race : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					types : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					counter : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					link : bincode.Collection(bincode.Tuple(bincode.u32, bincode.Tuple(bincode.String, bincode.String))),
					info : bincode.Collection(bincode.Tuple(bincode.String, bincode.String)),
					other : bincode.Collection(bincode.Tuple(bincode.String, bincode.String)),
					btn : bincode.Collection(bincode.Tuple(bincode.String, bincode.Tuple(bincode.String, bincode.String))),
					avatar : bincode.Collection(bincode.String)
				}), result).value as any;
			} catch (error) {
				fs.write.log(error);
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
				const result = await invoke<ArrayBuffer>('get_cards');
				return (bincode.decode(bincode.Collection(
					bincode.Tuple(
						bincode.Collection(bincode.i64),
						bincode.Collection(bincode.String),
					)), result).value as any as Array<[Array<number>, Array<string>]>)
						.map(i => [i[0][0], new Card(i.flat())]);
			} catch (error) {
				fs.write.log(error);
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
				const result = await invoke<ArrayBuffer>('get_system');
				return bincode.decode(
					bincode.Struct({
						string : bincode.Collection(bincode.Tuple(bincode.String, bincode.String)),
						bool : bincode.Collection(bincode.Tuple(bincode.String, bincode.bool)),
						number : bincode.Collection(bincode.Tuple(bincode.String, bincode.f64)),
						array : bincode.Collection(bincode.Tuple(bincode.String,  bincode.Collection(bincode.String))),
					}), result).value as any;
			} catch (error) {
				fs.write.log(error);
				return {
					string : [],
					bool : [],
					number : [],
					array : []
				};
			}
		},
		get_server : async () : Promise<Array<[string, string]>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_server');
				return bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.String)
				), result).value as Array<[string, string]>;
			} catch (error) {
				fs.write.log(error);
				return [];
			}
		},
		get_lflist : async () : Promise<Array<[string, LFList]>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_lflist');
				return (bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.Struct({
						hash : bincode.u32,
						genesys : bincode.u32,
						lflist : bincode.Collection(bincode.Tuple(bincode.u32, bincode.u32)),
						glist : bincode.Collection(bincode.Tuple(bincode.u32, bincode.u32))
					}))
				), result).value as Array<[string, {
					hash : number,
					genesys : number,
					lflist : Array<[number, number]>,
					glist : Array<[number, number]>
				}]>).map(i => [i[0], new LFList(i[0], i[1])]);
			} catch (error) {
				fs.write.log(error);
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
				const result = await invoke<ArrayBuffer>('get_strings');
				return bincode.decode(bincode.Struct({
					system : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					victory : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					counter : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					setname : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String))
				}), result).value as any;
			} catch (error) {
				fs.write.log(error);
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
				const result = await invoke<ArrayBuffer>('get_info');
				return bincode.decode(bincode.Struct({
					ot : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					attribute : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					link : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					category : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					race : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					types : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String))
				}), result).value as any;
			} catch (error) {
				fs.write.log(error);
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
		get_model : async () : Promise<Array<[string, string]>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_model');
				return bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.String)
				), result).value as Array<[string, string]>;
			} catch (error) {
				fs.write.log(error);
				return [];
			}
		}
	};
	deck = {
		get : async () : Promise<Array<Deck>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_deck');
				return (bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.String)
				), result).value as Array<[string, string]>)
					.map(i => Deck.fromYdkString(i[1]).set_name(i[0]));
			} catch (error) {
				fs.write.log(error);
				return [];
			}
		},
		write : async (name : string, deck : string) : Promise<boolean> => {
			try {
				await invoke<ArrayBuffer>('write_deck', {
					name : `${name}${name.endsWith('.ydk') ? '' : '.ydk'}`,
					deck : deck
				});
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		rename : async (old_name : string, new_name : string) : Promise<boolean> => {
			try {
				await invoke<ArrayBuffer>('rename_deck', {
					oldName : old_name,
					newName : new_name
				});
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		del : async (name : string) : Promise<boolean> => {
			try {
				await invoke<ArrayBuffer>('del_deck', {
					name : `${name}${name.endsWith('.ydk') ? '' : '.ydk'}`
				});
				return true;
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		}
	};
};

const _Invoke = new Invoke();
export default _Invoke;
export type { Srv };