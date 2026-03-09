import { fetch } from '@tauri-apps/plugin-http';

import fs from '@/script/fs';

class Http {
	cache : Map<string, any> = new Map();

	get = async <T>(url : string) : Promise<T | undefined> => {
		if (this.cache.has(url))
			return this.cache.get(url)!;
		try {
			const response = await fetch(url);
			const data : T = await response.json();
			this.cache.set(url, data);
			return data;
		} catch (e) {
			fs.write.log(e);
		}
		return undefined;
	}
};

export default new Http();