import * as sound_player from 'tauri-plugin-sound-player';
import invoke from './invoke';
import mainGame from './game';
import { KEYS } from './constant';

class Voice {
	id : sound_player.SoundId = 0;
	bgm = new Map<string, string>();
	sound_effect = new Map<string, string>();

	init = async (bgm : Array<[string, string]>) : Promise<void> => {
		for (const [i, v] of bgm) {
			(i.startsWith('SOUND_EFFECT_')
				? this.sound_effect
				: this.bgm)
				.set(i, v);
		}
		await sound_player.stopAll();
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
