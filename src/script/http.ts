import { fetch } from './tauri';

class Http {
	private cache : Map<string, any> = new Map();
	private pending : Map<string, Promise<any>> = new Map();

	get = async <T>(url : string, encoding : 'json' | 'text' | 'blob' | 'arrayBuffer' = 'json') : Promise<T> => {
		const key = JSON.stringify([url, encoding]);
		if (this.cache.has(key))
			return this.cache.get(key)!;
		const pending = this.pending.get(key);
		if (pending)
			return pending as Promise<T>;

		const request = (async () : Promise<T> => {
			const response = await fetch(url);
			const data : T = await response[encoding]();
			this.cache.set(key, data);
			return data;
		})();
		this.pending.set(key, request);
		try {
			return await request;
		} finally {
			this.pending.delete(key);
		}
	}
};

export default new Http();