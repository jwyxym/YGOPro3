import { defineComponent, onMounted } from 'vue';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';

class Voice {
	playing ?: HTMLAudioElement = undefined;
	audio = {
		bgm : new Map<string, HTMLAudioElement>(),
		sound_effect : new Map<string, HTMLAudioElement>()
	};

	set = {
		bgm : (el : HTMLAudioElement | null, key : string) => el
			? (() => {
				this.audio.bgm.set(key, el);
				el.volume = mainGame.get.system(KEYS.SETTING_VOICE_BGM) as number;
			})()
			: this.audio.bgm.delete(key),
		sound_effect : (el : HTMLAudioElement | null, key : string) => el
			? (() => {
				this.audio.sound_effect.set(key, el);
				el.volume = mainGame.get.system(KEYS.SETTING_VOICE_SOUND_EFFECT) as number;
			})()
			: this.audio.sound_effect.delete(key),
	};

	update = {
		bgm : (v ?: number) : void => this.audio.bgm
			.forEach(i => i.volume = Math.min(1, v !== undefined
				? v
				: mainGame.get.system(KEYS.SETTING_VOICE_BGM) as number)
			),
		sound_effect : (v ?: number) : void => this.audio.sound_effect
			.forEach(i => i.volume = Math.min(1, v !== undefined
				? v
				: mainGame.get.system(KEYS.SETTING_VOICE_SOUND_EFFECT) as number)
			)
	};

	play = {
		bgm : async (key : string) : Promise<void> => {
			if (this.playing) {
				this.playing.pause();
				this.playing.currentTime = 0;
			}
			this.playing = this.audio.bgm.get(key);
			await this.playing?.play();
		},
		sound_effect : async (key : string, ct : number = 1) : Promise<void> => {
			const sound = this.audio.sound_effect.get(key);
			if (sound) {
				for (let i = 0; i < ct; i ++) {
					sound.currentTime = 0;
					await sound.play();
					await mainGame.sleep(sound.duration);
				}
			}
		}
	};
}

const voice = new Voice();

const _Voice = defineComponent({
	setup () {
		onMounted(async () => await voice.play.bgm(KEYS.BACK_BGM));
		return () => 
			<div>
				{Array.from(mainGame.bgm).map(([i, v]) =>
					<audio
						loop = {!i.startsWith('SOUND_EFFECT_')}
						key = {i}
						id = {i}
						ref = {(el) => i.startsWith('SOUND_EFFECT_')
							? voice.set.sound_effect(el as HTMLAudioElement | null, i)
							: voice.set.bgm(el as HTMLAudioElement | null, i)
						}
					>
						<source src = {v}/>
					</audio>
				)}
			</div>;
	},
});

export default _Voice;
export { voice };