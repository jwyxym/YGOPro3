import { defineComponent } from 'vue';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';

class Voice {
	playing ?: HTMLAudioElement = undefined;
	audio : Map<string, HTMLAudioElement> = new Map();

	set_elements = (el : HTMLAudioElement | null, key : string) => el ? (() => {
			this.audio.set(key, el);
			el.volume = mainGame.get.system(KEYS.SETTING_VOICE_BACK_BGM) as number;
		})() : this.audio.delete(key);

	update = () : void => this.audio.forEach(i => i.volume = mainGame.get.system(KEYS.SETTING_VOICE_BACK_BGM) as number);

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

export default defineComponent({
	name : 'Voice',
	setup() {
		const Voice = {
			bgm : mainGame.bgm,
			voice : voice
		};
		return {
			Voice
		};
	},
	template : `
		<div>
			<audio
				loop
				v-for = '[i, v] in Voice.bgm'
				:key = 'i'
				:id = 'i'
				:ref = '(el) => Voice.voice.set_elements(el, i)'
			>
				<source :src = 'v'>
			</audio>
		</div>
	`
});

export { voice };