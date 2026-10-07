import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import mitt from 'mitt';

class Listen {
	private events = mitt<{
		started : number;
		progress : number;
		end : undefined;
		debug : string;
	}>();

	emit = (event : 'started' | 'progress' | 'end', num ?: number) => {
		if (__WEB__)
			this.events.emit(event, num);
	};

	start = async (f : (all: number) => void) : Promise<UnlistenFn> => {
		if (__WEB__) {
			this.events.on('started', f);
			return () => this.events.off('started', f);
		} else
			return listen<number>('started', event => f(event.payload));
	};

	progress = async (f : (progress: number) => void) : Promise<UnlistenFn> => {
		if (__WEB__) {
			this.events.on('progress', f);
			return () => this.events.off('progress', f);
		} else
			return listen<number>('progress', event => f(event.payload));
	};

	end = async (f : () => void) : Promise<UnlistenFn> => {
		if (__WEB__) {
			this.events.on('end', f);
			return () => this.events.off('end', f);
		} else
			return listen('end', () => f());
	};

	debug = async (f : (progress: string) => void) : Promise<UnlistenFn> => {
		if (__WEB__) {
			this.events.on('debug', f);
			return () => this.events.off('debug', f);
		} else
			return listen<string>('debug', event => f(event.payload));
	};
}

const listenner = new Listen();

export default listenner;