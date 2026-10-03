import * as sound_player from 'tauri-plugin-sound-player';
import invoke from '@/script/invoke';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import BaseVoice from './base';

class Voice extends BaseVoice {
	id : sound_player.SoundId = 0;

	init = async (bgm : Array<[string, string]>) : Promise<void> => {
		this.load(bgm);
		await sound_player.stopAll();
		this.id = 0;
		await this.play.bgm(KEYS.BACK_BGM);
	};

	play = {
		bgm : async (key : string) : Promise<void> => {
			try {
				const i = this.bgm.get(key);
				if (i) {
					if (this.id)
						await sound_player.stop(this.id);
					this.id = await sound_player.playLoop({
						path : i,
						volume : mainGame.get.system(KEYS.SETTING_VOICE_BGM) as number
					});
				}
			} catch (error) {
				await invoke.log.write(error);
			}
		},
		sound_effect : async (key : string) : Promise<void> => {
			try {
				const i = this.sound_effect.get(key);
				if (i)
					await sound_player.playOnce({
						path : i,
						volume : mainGame.get.system(KEYS.SETTING_VOICE_SOUND_EFFECT) as number
					});
			} catch (error) {
				await invoke.log.write(error);
			}
		}
	};

	update = {
		bgm : async (v ?: number) : Promise<void> => {
			if (this.id)
				try {
					await sound_player.setVolume(this.id,
						Math.min(1, v !== undefined ? v
							: mainGame.get.system(KEYS.SETTING_VOICE_BGM) as number
						)
					);
				} catch (error) {
					await invoke.log.write(error);
				}
		}
	};
}

const voice = new Voice();
export default voice;
