import { invoke } from '@tauri-apps/api/core';
import fs from '@/script/fs';
import * as bincode from 'bincode-ts';
import Deck from '@/pages/deck/deck';
import Card from '../card';
import LFList from '../lflist';

interface Srv {
	priority : number;
	weight : number;
	port : number;
	target : string;
};

interface Pic {
	path : string;
	code : number;
	url ?: string;
}

interface Resp {
	url : string;
	state : number;
	time : number;
}

interface Result<T> {
	ok ?: T;
	error ?: string;
};

type DataBase = Array<[Array<number>, Array<string>]>;
type File<T> = Array<[T, { ok : string | Uint8Array }]>;
type StringFile<T> = Array<[T, { ok : string }]>;
type BufferFile<T> = Array<[T, { ok : Uint8Array }]>;

class Invoke {
	game = {
		exists : async () : Promise<boolean> => {
			try {
				return await invoke<boolean>('exists');
			} catch (error) {
				fs.write.log(error);
				return false;
			}
		},
		init : async () : Promise<void> => {
			try {
				await invoke<void>('init');
			} catch (error) {
				fs.write.log(error);
			}
		},
		reload : async (overwrite : boolean) : Promise<void> => {
			try {
				await invoke<void>('reload', { overwrite : overwrite });
			} catch (error) {
				fs.write.log(error);
			}
		},
		download : async (url ?: string) : Promise<void> => {
			try {
				await (url ? true
					: invoke<void>('download_assets'));
			} catch (error) {
				fs.write.log(error);
			}
		},
		get_pic : async (deck : Array<number>) : Promise<Array<[number, string]>> => {
			try {
				const result = await invoke<ArrayBuffer>('get_pic', { deck : deck });
				const pics : [Array<[number, string]>, Array<[number, Array<number>]>] =  bincode.decode(bincode.Tuple(
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
						bincode.Collection(bincode.u32),
						bincode.Collection(bincode.String),
					)), result).value as Array<[Array<number>, Array<string>]>)
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
		},
		get_deck : async () : Promise<Array<Deck>> => {
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
	}
	
	read = {
		time : async (time : string) : Promise<Result<string>> => {
			const result : Result<string> = {};
			try {
				result.ok = await invoke<string>('read_time', {
					time : time
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		db : async (path : string) : Promise<Result<DataBase>> => {
			const result : Result<DataBase> = {};
			try {
				result.ok = await invoke<DataBase>('read_db', {
					path : path,
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		texts : async (dirs : string | Array<string>, file_type : string | Array<string>) : Promise<Result<StringFile<string>>> => {
			const result : Result<StringFile<string>> = {};
			try {
				result.ok = await invoke<StringFile<string>>('read_texts', {
					dirs : typeof dirs === 'string' ? [dirs] : dirs,
					fileType : typeof file_type === 'string' ? [file_type] : file_type
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		files : async (dir : string, file_type : string | Array<string>) : Promise<Result<BufferFile<string>>> => {
			const result : Result<BufferFile<string>> = {};
			try {
				result.ok = await invoke<BufferFile<string>>('read_files', {
					dirs : [dir],
					fileType : typeof file_type === 'string' ? [file_type] : file_type
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		pics : async (dirs : Array<string>, codes : Array<number>) : Promise<Result<[Array<Pic>, Array<number>]>> => {
			const result : Result<[Array<Pic>, Array<number>]> = {};
			try {
				result.ok = await invoke<[Array<Pic>, Array<number>]>('read_pics', {
					dirs : dirs, codes: codes
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		zip : async (path : string, file_type : Array<string>) : Promise<Result<File<string>>> => {
			const result : Result<File<string>> = {};
			try {
				result.ok = await invoke<File<string>>('read_zip', {
					path : path, fileType: file_type
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		}
	};

	network = {
		version : async (url : string, headers : Array<[string, string]> = []) : Promise<Result<string>> => {
			const result : Result<string> = {};
			try {
				result.ok = await invoke<string>('network_version', {
					url : url, headers : headers
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		srv : async (url : string) : Promise<Result<Srv>> => {
			const result : Result<Srv> = {};
			try {
				const res = await invoke<Srv>('network_srv', {
					url : `_ygopro._tcp.${url}`
				});
				if (res.target.endsWith('.'))
					res.target = res.target.slice(0, -1);
				result.ok = res;
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		time : async (urls : Array<string>) : Promise<Result<Resp | undefined>> => {
			const result : Result<Resp | undefined> = {};
			try {
				result.ok = (await invoke<Array<Resp>>('network_time', {
					urls : urls
				}))[0];
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		},
		download : async (url : string, path : string, name : string, ex_name : string = '') : Promise<Result<string>> => {
			const result : Result<string> = {};
			try {
				result.ok = await invoke<string>('network_download', {
					url : url,
					path : path,
					name : name,
					exName : ex_name
				});
			} catch (error) {
				fs.write.log(error);
				result.error = error;
			}
			return result;
		}
	}

	unzip = async (path : string, file : string, chk : boolean) : Promise<Result<void>> => {
		const result : Result<void> = {};
		try {
			await invoke<void>('unzip', {
				path : path, file : file, chk : chk
			});
	 	} catch (error) {
			fs.write.log(error);
			result.error = error;
		}
		return result;
	};
};

export default new Invoke();
export type { Result, DataBase, File, StringFile, BufferFile, Srv, Pic, Resp };