import { listen, UnlistenFn } from '@tauri-apps/api/event';

class Listen {
	start = async (f : Function) : Promise<UnlistenFn> => await listen<number>('started', async (event) => await f(event.payload));

	progress = async (f : Function) : Promise<UnlistenFn> => await listen<number>('progress', async (event) => await f(event.payload));
	
	end = async (f : Function) : Promise<UnlistenFn> => await listen<number>('end', async () => await f());
}

export default new Listen();