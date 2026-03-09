import * as fs from '@tauri-apps/plugin-fs';
import * as CONSTANT from './constant';

import Deck from '@/pages/deck/deck';
import { toast } from '@/pages/toast/toast';

interface File {
	name : string;
	url : string;
}

class Fs {
	dir : fs.ReadFileOptions;
	base_dir : number;
	rename_dir : fs.RenameOptions;
	copy_dir : fs.CopyFileOptions;

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

	exists = async (file : string) : Promise<boolean> => {
		try {
			return fs.exists(file, this.dir);
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
		dir : async (dir : string, extension : Array<string> = [], this_dir : fs.ReadFileOptions = this.dir) : Promise<Array<string>> => {
			try {
				let result : Array<fs.DirEntry> = await fs.readDir(dir, this_dir);
				return result
					.filter(i => extension.length ? extension.findIndex(v => i.name.endsWith(v)) > - 1
						: true)
					.map(i => i.name);
			} catch (error) {
				this.write.log(error);
			}
			return [];
		}
	}

	write = {
		ydk : async (ydk : Deck) : Promise<boolean> => {
			try {
				await fs.writeTextFile(`deck/${ydk.name}.ydk`, ydk.toYdkString(), this.dir);
				return true;
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
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
		}
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
				return this.delete.file(`deck/${file}${file.endsWith('.ydk') ? '' : '.ydk'}`);
			} catch (error) {
				this.write.log(error);
			}
			return false;
		},
		ypk : async (file : string) : Promise<boolean> => {
			try {
				return this.delete.file(`expansions/${file}${file.endsWith('.ypk') || file.endsWith('.zip') ? '' : '.ypk'}`);
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
					`deck/${old_path}.ydk`,
					`deck/${new_path}.ydk`
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