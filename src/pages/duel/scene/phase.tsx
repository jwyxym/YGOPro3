import { defineComponent } from 'vue';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { PHASE } from '@/pages/duel/ygo-protocol/network';

class _Phase {
	element : HTMLDivElement | null = null;
	animation : Animation | undefined = undefined;
	set_element = (el : HTMLDivElement | null) : void => {
		if (this.element === el)
			return;
		this.animation?.cancel();
		this.animation = undefined;
		this.element = el;
	};
	map = new Map([
		[PHASE.NONE, mainGame.get.text(I18N_KEYS.DUEL_PHASE_NEW)],
		[PHASE.DRAW, mainGame.get.text(I18N_KEYS.DUEL_PHASE_DRAW)],
		[PHASE.STANDBY, mainGame.get.text(I18N_KEYS.DUEL_PHASE_STANDBY)],
		[PHASE.MAIN1, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN1)],
		[PHASE.BATTLE_START, mainGame.get.text(I18N_KEYS.DUEL_PHASE_BATTLE)],
		[PHASE.MAIN2, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN2)],
		[PHASE.END, mainGame.get.text(I18N_KEYS.DUEL_PHASE_END)],
	]);
	on = async (tp : 0 | 1, phase : number) : Promise<void> => {
		const element : HTMLDivElement | null = this.element;
		if (!element) return;
		this.animation?.cancel();
		element.textContent = this.map.get(phase) ?? '';
		element.style.background = `linear-gradient(to right, ${tp ? 'red' : 'blue'}, transparent)`;
		const animation : Animation = element.animate([
			{ opacity : 0, visibility : 'visible', transform : 'translate(-50%, calc(-50% + 12px))', offset : 0 },
			{ opacity : 1, visibility : 'visible', transform : 'translate(-50%, -50%)', offset : 0.375 },
			{ opacity : 1, visibility : 'visible', transform : 'translate(-50%, -50%)', offset : 0.625 },
			{ opacity : 0, visibility : 'visible', transform : 'translate(-50%, calc(-50% - 12px))', offset : 1 }
		], {
			duration : 400,
			easing : 'ease-in-out'
		});
		this.animation = animation;
		try {
			await animation.finished;
		} catch {} finally {
			if (this.animation === animation) {
				animation.cancel();
				this.animation = undefined;
			}
		}
	};
};

const phase  = new _Phase();

const Phase = defineComponent({
	setup () {
		return () => <div
			ref = {(el) => phase.set_element(el as HTMLDivElement | null)}
			style = {{
				'width' : '1000px',
				'opacity' : '0',
				'visibility' : 'hidden',
				'pointer-events' : 'none',
				'color' : 'white',
				'position' : 'fixed',
				'left' : '50%',
				'top' : '50%',
				'font-size' : '102px',
				'transform' : 'translate(-50%, -50%)',
				'z-index' : '10',
				'font-weight' : '900',
				'font-style' : 'italic',
				'display' : 'grid',
				'justify-content' : 'center',
				'justify-items' : 'center',
				'align-content' : 'center',
				'align-items' : 'center',
				'white-space' : 'nowrap'
			}}
		>
		</div>;
	},
});

export default Phase;
export { phase };