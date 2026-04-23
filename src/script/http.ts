import { fetch } from '@tauri-apps/plugin-http';
import mainGame from './game';

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
			mainGame.log.write(e);
		}
		return undefined;
	}
};

export default new Http();