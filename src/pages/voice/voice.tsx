import { defineComponent, onMounted } from 'vue';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';

class Voice {
	playing ?: HTMLAudioElement = undefined;
	audio : Map<string, HTMLAudioElement> = new Map();

	set_elements = (el : HTMLAudioElement | null, key : string) => el
		? (() => {
			this.audio.set(key, el);
			el.volume = mainGame.get.system(KEYS.SETTING_VOICE) as number;
		})()
		: this.audio.delete(key);

	update = () : void => this.audio
		.forEach(i => i.volume = Math.min(1, mainGame.get.system(KEYS.SETTING_VOICE) as number));

	play = async (key : string) : Promise<void> => {
		if (this.playing) {
			this.playing.pause();
			this.playing.currentTime = 0;
		}
		this.playing = this.audio.get(key);
		if (this.playing)
			await this.playing.play();
	};

	play_sound_effect = async (key : string, ct : number = 1) : Promise<void> => {
		const sound = this.audio.get(key);
		if (sound) {
			for (let i = 0; i < ct; i ++) {
				sound.currentTime = 0;
				await sound.play();
				await mainGame.sleep(sound.duration);
			}
		}
	};
}

const voice = new Voice();

const _Voice = defineComponent({
	setup () {
		onMounted(async () => await voice.play(KEYS.BACK_BGM));
		return () => 
			<div>
				{Array.from(mainGame.bgm).map(([i, v]) =>
					<audio
						loop = {!i.startsWith('SOUND_EFFECT_')}
						key = {i}
						id = {i}
						ref = {(el) => voice.set_elements(el as HTMLAudioElement | null, i)}
					>
						<source src = {v}/>
					</audio>
				)}
			</div>;
	},
});

export default _Voice;
export { voice };