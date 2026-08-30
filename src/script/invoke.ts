import { invoke as tauri_invoke, type InvokeArgs } from '@tauri-apps/api/core';
import * as bincode from 'bincode-ts';
import Deck from '@/pages/deck/deck';
import Card from './card';
import LFList from './lflist';
import { toast } from '@/pages/toast/toast';

interface Srv {
	priority : number;
	weight : number;
	port : number;
	target : string;
};

const _invoke = <T>(command : string, args ?: InvokeArgs) : Promise<T> => (
	tauri_invoke<T>(`plugin:ygopro3|${command}`, args)
);

class Invoke {
	game = {
		init : async () : Promise<boolean> => {
			try {
				await _invoke<void>('init');
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		reload : async (overwrite : boolean) : Promise<boolean> => {
			try {
				await _invoke<void>('reload', { overwrite : overwrite });
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		time : async (path : Array<string>) : Promise<Date | undefined> => {
			try {
				const time = await _invoke<string>('get_time', { path : path });
				return time.length > 0 ? new Date(time) : undefined;
			} catch (error) {
				await this.log.write(error);
				return undefined;
			}
		},
		version : async () : Promise<string> => await _invoke<string>(
			'get_version'
		),
		chk_version : async () : Promise<boolean> => {
			try {
				return await _invoke<boolean>('chk_version');
			} catch (error) {
				await this.log.write(error);
				return true;
			}
		},
		download : async (url : string, name ?: string, chunk ?: number) : Promise<string> => {
			try {
				return await _invoke<string>('download', { url : url, name : name ?? '', chunk : chunk ?? 0});
			} catch (error) {
				await this.log.write(error);
				return '';
			}
		},
		set_system : async (key : string, ct : number, value : string | number | boolean | Array<string>, write : boolean) : Promise<boolean> => {
			try {
				await _invoke<void>('set_system', { key : key, ct : ct, value : JSON.stringify(value), write : write });
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		get_srv : async (url : string) : Promise<string> => {
			try {
				const result = await _invoke<Srv>('get_srv', { url : url });
				return result.target + ':' + result.port;
			} catch (error) {
				await this.log.write(error);
				return url;
			}
		},
		get_pic : async (deck : Array<number>) : Promise<Array<[number, string]>> => {
			try {
				if (!deck.length) return [];
				const buffer = new ArrayBuffer(Math.max(1024, deck.length * 5 + 1));
				const size = bincode.encode(bincode.Collection(bincode.u32), deck, buffer);
				const encoded = new Uint8Array(buffer.slice(0, size));
				const result = await _invoke<ArrayBuffer>('get_pic', encoded);
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
				await this.log.write(error);
				return [];
			}
		},
		get_sound : async () : Promise<Array<[string, string]>> => {
			try {
				const result = await _invoke<ArrayBuffer>('get_sound');
				return bincode.decode(
					bincode.Collection(bincode.Tuple(bincode.String, bincode.String)), result
				).value as Array<[string, string]>;
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
				const result = await _invoke<ArrayBuffer>('get_textures');
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
				const result = await _invoke<ArrayBuffer>('get_cards');
				return (bincode.decode(bincode.Collection(
					bincode.Struct({
						name : bincode.String,
						desc : bincode.String,
						hint : bincode.Array(bincode.String, 16),
						code : bincode.u32,
						alias : bincode.u32,
						setcode : bincode.Array(bincode.u16, 16),
						card_type : bincode.u32,
						level : bincode.u32,
						attribute : bincode.u32,
						race : bincode.u32,
						attack : bincode.i32,
						defense : bincode.i32,
						lscale : bincode.u32,
						rscale : bincode.u32,
						link_marker : bincode.u32,
						ot : bincode.u8,
						category : bincode.u32
					})), result).value as Array<{
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
					}>)
						.map(i => [i.code, new Card(i)]);
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
				const result = await _invoke<ArrayBuffer>('get_system');
				return bincode.decode(
					bincode.Struct({
						string : bincode.Collection(bincode.Tuple(bincode.String, bincode.String)),
						bool : bincode.Collection(bincode.Tuple(bincode.String, bincode.bool)),
						number : bincode.Collection(bincode.Tuple(bincode.String, bincode.f64)),
						array : bincode.Collection(bincode.Tuple(bincode.String,  bincode.Collection(bincode.String))),
					}), result).value as any;
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
		get_server : async () : Promise<Array<[string, string]>> => {
			try {
				const result = await _invoke<ArrayBuffer>('get_server');
				return bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.String)
				), result).value as Array<[string, string]>;
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_lflist : async () : Promise<Array<[string, LFList]>> => {
			try {
				const result = await _invoke<ArrayBuffer>('get_lflist');
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
				const result = await _invoke<ArrayBuffer>('get_strings');
				return bincode.decode(bincode.Struct({
					system : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					victory : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					counter : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					setname : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String))
				}), result).value as any;
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
				const result = await _invoke<ArrayBuffer>('get_info');
				return bincode.decode(bincode.Struct({
					ot : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					attribute : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					link : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					category : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					race : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String)),
					types : bincode.Collection(bincode.Tuple(bincode.u32, bincode.String))
				}), result).value as any;
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
				const result = await _invoke<ArrayBuffer>('get_room');
				return bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.String)
				), result).value as Array<[string, string]>;
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		get_hash : async () : Promise<ArrayBuffer | undefined> => {
			try {
				return await _invoke<ArrayBuffer>('get_hash');
			} catch (error) {
				await this.log.write(error);
				return undefined;
			}
		}
	};
	deck = {
		get : async () : Promise<Array<Deck>> => {
			try {
				const result = await _invoke<ArrayBuffer>('get_deck');
				return (bincode.decode(bincode.Collection(
					bincode.Tuple(bincode.String, bincode.String)
				), result).value as Array<[string, string]>)
					.map(i => Deck.fromYdkString(i[1]).set_name(i[0]));
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		write : async (name : string, deck : string) : Promise<boolean> => {
			try {
				await _invoke<void>('write_deck', {
					name : `${name}${name.endsWith('.ydk') ? '' : '.ydk'}`,
					deck : deck
				});
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		rename : async (old_name : string, new_name : string) : Promise<boolean> => {
			try {
				await _invoke<void>('rename_deck', {
					oldName : old_name,
					newName : new_name
				});
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		del : async (name : string) : Promise<boolean> => {
			try {
				await _invoke<void>('del_deck', {
					name : `${name}${name.endsWith('.ydk') ? '' : '.ydk'}`
				});
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		}
	};
	ypk = {
		del : async (name : string) : Promise<boolean> => {
			try {
				await _invoke<void>('del_ypk', { name : name });
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		exists : async (name : string) : Promise<boolean> => {
			try {
				return await _invoke<boolean>('exists_ypk', { name : name });
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		
		get : async () : Promise<Array<string>> => {
			try {
				const result = await _invoke<ArrayBuffer>('get_ypk');
				return bincode.decode(
					bincode.Collection(bincode.String), result
				).value as Array<string>;
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		load : async (name ?: string) : Promise<boolean | Array<string>> => {
			try {
				if (name) {
					await _invoke<void>('load_ypk', { name : name });
					return true;
				} else return await this.ypk.get();
			} catch (error) {
				await this.log.write(error);
				return name ? false : [];
			}
		},
		unload : async (name : string) : Promise<boolean> => {
			try {
				await _invoke<void>('unload_ypk', { name : name });
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		}
	};
	server = {
		start : async (i : {
			lflist : number;
			rule : number;
			mode : number;
			replayMode : number;
			duelRule : number;
			noCheckDeck : number;
			noShuffleDeck : number;
			startLp : number;
			startHand : number;
			drawCount : number;
			timeLimit : number;
		}) : Promise<number> => {
			try {
				return await _invoke<number>('ygoserver_start', i);
			} catch (error) {
				await this.log.write(error);
				return 0;
			}
		},
		stop : async () : Promise<boolean> => {
			try {
				await _invoke<void>('ygoserver_stop');
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		}
	};
	bot = {
		start : async (args : string, deck : string) : Promise<boolean> => {
			try {
				await _invoke<void>('windbot_start', { args : args, deck : deck});
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		stop : async () : Promise<boolean> => {
			try {
				await _invoke<void>('windbot_stop');
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		list : async () : Promise<Array<[string, string, string]>> => {
			try {
				const result = await _invoke<ArrayBuffer>('windbot_list');
				return bincode.decode(
					bincode.Collection(bincode.Tuple(bincode.String, bincode.String, bincode.String)), result
				).value as any;
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		}
	};
	replay = {
		read : async (name : string) : Promise<Uint8Array> => {
			try {
				return new Uint8Array(await _invoke<ArrayBuffer>('replay_read', { name : name}));
			} catch (error) {
				await this.log.write(error);
				return new Uint8Array();
			}
		},
		save : async (name : string, content : Uint8Array) : Promise<string | void> => {
			try {
				const buffer = new ArrayBuffer(256);
				bincode.encode(
					bincode.String,
					name,
					buffer
				);
				const encoded = new Uint8Array(buffer);
				const bytes = new Uint8Array(encoded.length + content.length);
				bytes.set(encoded, 0);
				bytes.set(content, encoded.length);
				return await _invoke<string>('replay_save', bytes);
			} catch (error) {
				await this.log.write(error);
			}
		},
		list : async () : Promise<Array<string>> => {
			try {
				const result = await _invoke<ArrayBuffer>('replay_list');
				return bincode.decode(
					bincode.Collection(bincode.String), result
				).value as any;
			} catch (error) {
				await this.log.write(error);
				return [];
			}
		},
		rename : async (from : string, to : string) : Promise<boolean> => {
			try {
				await _invoke<ArrayBuffer>('replay_rename', { from : from, to : to });
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		del : async (name : string) : Promise<boolean> => {
			try {
				await _invoke<ArrayBuffer>('replay_del', { name : name });
				return true;
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		}
	};
	extend = {
		load : async (name : string, script : string) : Promise<string | undefined> => {
			if (!script.trim())
				return undefined;
			try {
				return await _invoke<string>('extend_load', { name, script });
			} catch (error) {
				await this.log.write(error);
				return undefined;
			}
		},
		unload : async (name : string) : Promise<boolean> => {
			try {
				await _invoke<void>('extend_unload', { name });
				return true
			} catch (error) {
				await this.log.write(error);
				return false;
			}
		},
		call : async<T> (name : string, args : Array<any>) : Promise<T | undefined> => {
			try {
				return JSON.parse(
					await _invoke<string>('extend_call', { name, args : JSON.stringify(args) })
				) as T;
			} catch (error) {
				await this.log.write(error);
				return undefined;
			}
		},
	};
	log = {
		write : async (line : string) : Promise<boolean> => {
			try {
				console.error(line);
				toast.error(line);
				await _invoke<void>('write_log', { line : line.toString() });
				return true;
			} catch (error) {
				toast.error(error.toString());
				return false;
			}
		}
	};
};

const invoke = new Invoke();
export default invoke;
export type { Srv };