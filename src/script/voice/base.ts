abstract class BaseVoice {
	bgm = new Map<string, string>();
	sound_effect = new Map<string, string>();

	protected load = (sounds : Array<[string, string]>) : void => {
		this.bgm.clear();
		this.sound_effect.clear();
		for (const [key, url] of sounds) {
			(key.startsWith('SOUND_EFFECT_')
				? this.sound_effect
				: this.bgm)
				.set(key, url);
		}
	};

	abstract init : (sounds : Array<[string, string]>) => Promise<void>;

	abstract play : {
		bgm : (key : string) => Promise<void>;
		sound_effect : (key : string) => Promise<void>;
	};

	abstract update : {
		bgm : (volume ?: number) => Promise<void>;
	};
};

export default BaseVoice;
