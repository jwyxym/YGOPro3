import { defineComponent, onMounted } from 'vue';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';

class Voice {
	playing ?: HTMLAudioElement = undefined;
	audio : Map<string, HTMLAudioElement> = new Map();

	set_elements = (el : HTMLAudioElement | null, key : string) => el ? (() => {
		this.audio.set(key, el);
		el.volume = mainGame.get.system(KEYS.SETTING_VOICE) as number;
	})() : this.audio.delete(key);

	update = () : void => this.audio.forEach(i => i.volume = Math.min(1, mainGame.get.system(KEYS.SETTING_VOICE) as number));

	play = (key : string) : void => {
		if (this.playing) {
			this.playing.pause();
			this.playing.currentTime = 0;
		}
		this.playing = this.audio.get(key);
		this.playing?.play();
	};
}

const voice = new Voice();

const _Voice = defineComponent({
	setup () {
		onMounted(() => voice.play(KEYS.BACK_BGM));
		return () => 
			<div>
				{Array.from(mainGame.bgm).map(([i, v]) =>
					<audio
						loop
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