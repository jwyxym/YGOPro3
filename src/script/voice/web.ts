import invoke from '@/script/invoke';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import BaseVoice from './base';

class Voice extends BaseVoice {
	private current ?: HTMLAudioElement;
	private effects = new Set<HTMLAudioElement>();

	private volume = (key : string, value ?: number) : number => {
		const volume = value ?? mainGame.get.system(key);
		return typeof volume === 'number' && Number.isFinite(volume)
			? Math.max(0, Math.min(1, volume))
			: 1;
	};

	private release = (audio : HTMLAudioElement) : void => {
		audio.onended = null;
		audio.onerror = null;
		audio.pause();
		audio.removeAttribute('src');
		audio.load();
	};

	private clear_retry = () : void => {
		document.removeEventListener('click', this.retry, true);
		document.removeEventListener('keydown', this.retry, true);
	};

	private retry = () : void => {
		this.clear_retry();
		if (this.current)
			void this.start_bgm(this.current);
	};

	private start_bgm = async (audio : HTMLAudioElement) : Promise<void> => {
		try {
			await audio.play();
			if (this.current === audio)
				this.clear_retry();
		} catch (error) {
			if (this.current !== audio) return;
			if (error instanceof DOMException && error.name === 'NotAllowedError') {
				document.addEventListener('click', this.retry, true);
				document.addEventListener('keydown', this.retry, true);
				return;
			}
			this.current = undefined;
			this.clear_retry();
			this.release(audio);
			await invoke.log.write(error instanceof Error ? error.message : String(error));
		}
	};

	init = async (sounds : Array<[string, string]>) : Promise<void> => {
		this.clear_retry();
		const current = this.current;
		this.current = undefined;
		if (current)
			this.release(current);
		for (const audio of this.effects) {
			this.effects.delete(audio);
			this.release(audio);
		}
		this.load(sounds);
		await this.play.bgm(KEYS.BACK_BGM);
	};

	play = {
		bgm : async (key : string) : Promise<void> => {
			try {
				const url = this.bgm.get(key);
				if (!url) return;
				this.clear_retry();
				const current = this.current;
				this.current = undefined;
				if (current)
					this.release(current);
				const audio = new Audio(url);
				audio.loop = true;
				audio.volume = this.volume(KEYS.SETTING_VOICE_BGM);
				this.current = audio;
				audio.onerror = () => {
					if (this.current !== audio) return;
					const message = audio.error?.message || `Audio playback failed: ${url}`;
					this.current = undefined;
					this.clear_retry();
					this.release(audio);
					void invoke.log.write(message);
				};
				await this.start_bgm(audio);
			} catch (error) {
				await invoke.log.write(error instanceof Error ? error.message : String(error));
			}
		},
		sound_effect : async (key : string) : Promise<void> => {
			let audio : HTMLAudioElement | undefined;
			try {
				const url = this.sound_effect.get(key);
				if (!url) return;
				const effect = new Audio(url);
				audio = effect;
				this.effects.add(effect);
				effect.volume = this.volume(KEYS.SETTING_VOICE_SOUND_EFFECT);
				const cleanup = () : void => {
					this.effects.delete(effect);
					this.release(effect);
				};
				effect.onended = cleanup;
				effect.onerror = () => {
					const message = effect.error?.message || `Audio playback failed: ${url}`;
					cleanup();
					void invoke.log.write(message);
				};
				await effect.play();
			} catch (error) {
				if (audio) {
					if (!this.effects.delete(audio)) return;
					this.release(audio);
				}
				if (error instanceof DOMException && error.name === 'NotAllowedError') return;
				await invoke.log.write(error instanceof Error ? error.message : String(error));
			}
		}
	};

	update = {
		bgm : async (value ?: number) : Promise<void> => {
			if (this.current)
				this.current.volume = this.volume(KEYS.SETTING_VOICE_BGM, value);
		}
	};
};

const voice = new Voice();
export default voice;
