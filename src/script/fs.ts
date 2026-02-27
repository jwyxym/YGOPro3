import { convertFileSrc } from '@tauri-apps/api/core';
import * as fs from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

import * as CONSTANT from './constant';
import mainGame from './game';
import invoke, { Pic } from './tauri-api/invoke';
import { I18N_KEYS } from './language/i18n';
import SQL from './sql';

import Deck from '@/pages/deck/deck';
import { toast } from '@/pages/toast/toast';

interface File {
	name : string;
	url : string;
}

class Fs {
	dir : fs.ReadFileOptions;
	path ?: string;
	base_dir : number;
	rename_dir : fs.RenameOptions;
	copy_dir : fs.CopyFileOptions;
	join = path.join;

	constructor () {
		const base_dir = CONSTANT.BASE_DIR
		this.dir = { baseDir: base_dir };
		this.rename_dir = {
			oldPathBaseDir : base_dir,
			newPathBaseDir : base_dir
		}
		this.copy_dir = {
			fromPathBaseDir: base_dir,
			toPathBaseDir: base_dir
		}
		this.base_dir = base_dir
	};

	init_path = async () : Promise<void> => {
		this.path = await CONSTANT.BASE_PATH();
	}

	exists = async (file : string) : Promise<boolean> => {
		try {
			return fs.exists(file, this.dir);
		} catch (error) {
			this.write.log(error);
		}
		return false;
	};

	init = async (chk : boolean = false, chk_download : boolean = false) : Promise<boolean> => {
		try {
			await this.init_path();
			if (!await this.exists(CONSTANT.FILES.ASSETS_ZIP) || chk_download) {
				toast.info(mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_START));
				const urls = Array.from(CONSTANT.URL.ASSETS.keys());
				const res_time = await invoke.network.time(urls);
				if (!res_time.error) {
					const url = CONSTANT.URL.ASSETS.get(res_time.content!.url ?? urls[0])!;
					if ((await this.write.from_url(url, CONSTANT.FILES.ASSETS_ZIP)).length === 0)
						return false;
				}
				toast.info(mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_COMPELETE));
			}
			await invoke.unzip(this.path!, await path.join(this.path!, CONSTANT.FILES.ASSETS_ZIP), chk);
			return true;
		} catch (error) {
			this.write.log(error);
		}
		return false;
	};

	copy = async (from : string, to : string, dir : fs.CopyFileOptions = this.copy_dir) : Promise<boolean> => {
		try {
			await fs.copyFile(from, to, dir)
			return true;
		} catch (error) {
			this.write.log(error);
		}
		return false;
	};

	read = {
		db : async (file : string | Array<string>) : Promise<Array<Array<string | number>> | undefined> => {
			try {
				const join = typeof file === 'string' ? path.join(this.path!, file as string) : path.join(this.path!, ...file);
				const p = await join;
				const entries = await invoke.read.db(await path.join(p));
				if (entries.error === undefined)
					return entries.content!.map(i => (i[0] as Array<number | string>).concat(i[1]));
			} catch (error) {
				this.write.log(error);
			}
			return undefined;
		},
		db_by_vecu8 : async (file : Uint8Array<ArrayBuffer>) : Promise<Array<Array<string | number>> | undefined> => {
			let p = '';
			let result : Array<Array<string | number>> | undefined = undefined;
			try {
				const cdb = await SQL.find(file);
				if (cdb)
					result = cdb.values as Array<Array<string | number>>;
			} catch (error) {
				this.write.log(error);
			} finally {
				if (p.length > 0)
					await(this.delete.file(p));
			}
			return result;
		},
		pics : async (codes : Array<number> = []) : Promise<[Array<Pic>, Array<number>]> => {
			const folds = [
				await path.join(this.path!, CONSTANT.DIRS.EXPANSION, CONSTANT.DIRS.PIC)
			];
			if (!mainGame.is_pic_zip())
				folds.splice(0, 0, await path.join(this.path!, CONSTANT.DIRS.PIC));
			const entries = await invoke.read.pics(folds, codes);
			if (entries.error === undefined) {
				entries.content![0].forEach((_, v) => {
					const i = entries.content![0][v]
					i.url = convertFileSrc(i.path)
				});
				return entries.content!;
			}
			return [[], []];
		},
		zip : async (file : string, file_type : Array<string | number> = []) : Promise<Map<RegExp, Map<string, Blob | Uint8Array | string>>> => {
			let map = new Map([
				[CONSTANT.REG.DATABASE, new Map],
				[CONSTANT.REG.PICTURE, new Map],
				[CONSTANT.REG.CONF, new Map],
				[CONSTANT.REG.INI, new Map]
			]);
			try {
				const entries = await invoke.read.zip(await path.join(this.path!, file), file_type.map(i => `${i}`));
				if (entries.error === undefined)
					for (const [name, content] of entries.content!) {
						if (name.match(CONSTANT.REG.PICTURE)) {
							const blob = new Blob([new Uint8Array(content.content as Uint8Array)], { type : name.endsWith('png') ? 'image/png' : 'image/jpeg' })
							let filename = name.replace(/\\/g, '/').split('/').filter(part => part.trim() !== '').pop() || '';
							if (!filename.startsWith('.')) {
								const dotIndex = filename.lastIndexOf('.');
								filename = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
							}
							map.get(CONSTANT.REG.PICTURE)!.set(filename, blob);
						} else if (name.match(CONSTANT.REG.CONF)) {
							map.get(CONSTANT.REG.CONF)!.set(name, content.content as string);
						} else if (name.match(CONSTANT.REG.INI)) {
							map.get(CONSTANT.REG.INI)!.set(name, content.content as string);
						} else if (name.match(CONSTANT.REG.DATABASE)) {
							map.get(CONSTANT.REG.DATABASE)!.set(name, content.content as Uint8Array);
						}
					}
			} catch (error) {
				this.write.log(error);
			}
			return map;
		},
		text : async (file : string | Array<string>) : Promise<string | undefined> => {
			try {
				const p = typeof file === 'string' ? file : await path.join(...file);
				return await fs.readTextFile(p, this.dir);
			} catch (error) {
				this.write.log(error);
			}
			return undefined;
		},
		ydk : async () : Promise<Array<Deck>> => {
			try {
				const decks : Array<Deck> = [];
				const reader = await invoke.read.texts(await path.join(this.path!, CONSTANT.DIRS.DECK), 'ydk');
				if (reader.error === undefined) {
					reader.content!.forEach(i => {
						const ydk = Deck.fromYdkString(i[1].content);
						ydk.main = ydk.main.filter(i => mainGame.cards.has(i));
						ydk.extra = ydk.extra.filter(i => mainGame.cards.has(i));
						ydk.side = ydk.side.filter(i => mainGame.cards.has(i));
						ydk.push_name(i[0]);
						decks.push(ydk);
					});
				}
				return decks;
			} catch (error) {
				this.write.log(error);
			}
			return [];
		},
		files : async (dir : string, type : Array<string> | string) : Promise<Array<File>> => {
			try {
				const entries = await invoke.read.files(await path.join(this.path!, dir), type);

				const result : Array<File> = [];
				if (entries.error === undefined)
					for (const [name, content] of entries.content!) {
						result.push({
							name : name,
							url : URL.createObjectURL(new Blob([new Uint8Array(content.content)], { type : 'image/jpeg' }))
						});
					}
				return result;
			} catch (error) {
				this.write.log(error);
			}
			return [];
		},
		file : {
			as_url : async (file : string | Array<string>) : Promise<string | undefined> => {
				try {
					const join = typeof file === 'string' ? path.join(this.path!, file as string) : path.join(this.path!, ...file);
					const p = await join;
					return convertFileSrc(p);
				} catch (error) {
					this.write.log(error);
				}
				return undefined;
			},
			as_u8 : async (file : string | Array<string>) : Promise<Uint8Array<ArrayBuffer> | undefined> => {
				try {
					const p = typeof file === 'string' ? file : await path.join(...file);
					return await fs.readFile(p, this.dir);
				} catch (error) {
					this.write.log(error);
				}
				return undefined;
			},
		},
		dir : async (dir : string, full_path : boolean = true, extension : boolean = true, this_dir : fs.ReadFileOptions = this.dir) : Promise<Array<fs.DirEntry>> => {
			try {
				let result : Array<fs.DirEntry> = await fs.readDir(dir, this_dir);
				if (full_path)
					for (const i of result) {
						i.name = await path.join(dir, i.name);
					}
				if (!extension)
					for (const i of result) {
						const name = i.name;
						i.name = name.split('.')[0];
					}
				return result;
			} catch (error) {
				this.write.log(error);
			}
			return [];
		},
		bgm : async (file : string | Array<string>) : Promise<string | undefined> => {
			try {
				const read_to_blob = async () : Promise<string | undefined> => {
					const p = typeof file === 'string' ? file : await path.join(...file);
					const bgm = await this.read.file.as_u8(p);
					if (bgm)
						return URL.createObjectURL(
							new Blob([new Uint8Array(bgm)], { type : 'audio/wav' })
						)
					return undefined;
				}
				const read_to_src = async () : Promise<string> => {
					const join = typeof file === 'string' ? path.join(this.path!, file as string) : path.join(this.path!, ...file);
					const p = await join;
					return convertFileSrc(p);
				}
				return !!mainGame.get.system(CONSTANT.KEYS.SETTING_SELECT_VOICE) ? await read_to_blob() : await read_to_src();
			} catch (error) {
				this.write.log(error);
			}
			return undefined;
		},
		time : async (file : string | Array<string>) : Promise<string | undefined> => {
			try {
				const join = typeof file === 'string' ? path.join(this.path!, file as string) : path.join(this.path!, ...file);
				const p = await join;
				const entries = await invoke.read.time(p);
				if (entries.error === undefined)
					return entries.content!;
			} catch (error) {
				this.write.log(error);
			}
			return undefined;
		}
	};

	write = {
		log : async (text : string)  : Promise<boolean> => {
			try {
				const ERROR_LOG = 'error.log';
				console.error(text);
				toast.error(text);
				const log = `[${new Date().toLocaleString()}] ${text}${CONSTANT.LINE_FEED}`
				if (await fs.exists(ERROR_LOG, this.dir)) {
					const file = await fs.open(ERROR_LOG, { append: true, baseDir : this.dir.baseDir });
					await file.write(new TextEncoder().encode(log));
					await file.close();
				} else {
					const file = await fs.create(ERROR_LOG, this.dir)
					await file.write(new TextEncoder().encode(log));
					await file.close();
				}
				return true;
			} catch (error) {
				toast.error(error.toString());
				return false;
			}
		},
		system : async () : Promise<boolean> => {
			try {
				let system = '';
				for (const [k, i] of mainGame.system) {
					system += `${k} = ${i}${CONSTANT.LINE_FEED}`
				}
				await fs.writeTextFile(CONSTANT.FILES.SYSTEM_CONF, system, this.dir);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		ydk : async (file : string, ydk : Deck) : Promise<boolean> => {
			try {
				await fs.writeTextFile(await path.join(CONSTANT.DIRS.DECK, `${file}.ydk`), ydk.toYdkString(), this.dir);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		text : async (file : string, text : string) : Promise<boolean> => {
			try {
				await fs.writeTextFile(file, text, this.dir);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		file : async (file : string, data : Uint8Array<ArrayBufferLike>) : Promise<boolean> => {
			try {
				const f = await fs.create(file, this.dir);
				await f.write(data);
				await f.close();
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		dir : async (dir : string) : Promise<boolean> => {
			try {
				 await fs.mkdir(dir, this.dir)
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		from_url : async (url : string,  file : string) : Promise<string> => {
			try {
				const download = await invoke.network.download(url, this.path!, file);
				if (download.error === undefined)
					return download.content!;
			} catch (error) {
				this.write.log(error.message ?? error);
			}
			return '';
		},
		ypk : async (url : string, file : string = '') : Promise<Array<string>> => {
			try {
				if (file.length > 0 && !file.endsWith('.ypk'))
					file += '.ypk';
				const download = await invoke.network.download(url, await path.join(this.path!, CONSTANT.DIRS.EXPANSION), file, '.ypk');
				if (download.error === undefined) {
					const p = await path.join(CONSTANT.DIRS.EXPANSION, download.content!);
					return [p, download.content!];
				}
			} catch (error) {
				this.write.log(error.message ?? error);
			}
			return [];
		},
	};
	delete = {
		file : async (file : string) : Promise<boolean> => {
			try {
				await fs.remove(file, this.dir);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		ydk : async (file : string) : Promise<boolean> => {
			try {
				return this.delete.file(await path.join(CONSTANT.DIRS.DECK, `${file}${file.endsWith('.ydk') ? '' : '.ydk'}`));
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		ypk : async (file : string) : Promise<boolean> => {
			try {
				return await this.delete.file(await path.join(CONSTANT.DIRS.EXPANSION, `${file}${file.endsWith('.ypk') ? '' : '.ypk'}`));
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
	};
	rename = {
		file : async (old_path : string, new_path : string) : Promise<boolean> => {
			try {
				await fs.rename(old_path, new_path, this.rename_dir);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		ydk : async (old_path : string, new_path : string) : Promise<boolean> => {
			try {
				await this.rename.file(
					await path.join(CONSTANT.DIRS.DECK, `${old_path}.ydk`),
					await path.join(CONSTANT.DIRS.DECK, `${new_path}.ydk`)
				);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
	};
}

export default new Fs();
export type { File };