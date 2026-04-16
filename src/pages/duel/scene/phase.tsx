import { defineComponent } from 'vue';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { PHASE } from '../ygo-protocol/network';

class _Phase {
	element : HTMLDivElement | null = null;
	set_element = (el : HTMLDivElement | null) => this.element = el;
	map = new Map([
		[PHASE.NONE, mainGame.get.text(I18N_KEYS.DUEL_PHASE_NEW)],
		[PHASE.DRAW, mainGame.get.text(I18N_KEYS.DUEL_PHASE_DRAW)],
		[PHASE.STANDBY, mainGame.get.text(I18N_KEYS.DUEL_PHASE_STANDBY)],
		[PHASE.MAIN1, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN1)],
		[PHASE.BATTLE_START, mainGame.get.text(I18N_KEYS.DUEL_PHASE_BATTLE)],
		[PHASE.MAIN2, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN2)],
		[PHASE.END, mainGame.get.text(I18N_KEYS.DUEL_PHASE_END)],
	]);
	on = async (tp : 0 | 1, phase : number) => {
		if (!this.element) return;
		this.element.innerText = this.map.get(phase) ?? '';
		this.element.style.background = `linear-gradient(to right, ${tp ? 'red' : 'blue'}, transparent)`;
		this.element.style.width = '1000px';
		await mainGame.sleep(250);
		this.element.style.width = '0';
	};
};

const phase  = new _Phase();

const Phase = defineComponent({
	setup () {
		return () => <div
			ref = {(el) => phase.set_element(el as HTMLDivElement | null)}
			class = 'font-title'
			style = {{
				'width' : '0',
				'color' : 'white',
				'position' : 'fixed',
				'left' : '50%',
				'top' : '50%',
				'font-size' : '102px',
				'transform' : 'translate(-50%, -50%)',
				'z-index' : '10',
				'display' : 'grid',
				'justify-content' : 'center',
				'justify-items' : 'center',
				'align-content' : 'center',
				'align-items' : 'center',
				'overflow-x' : 'hidden',
				'transition' : 'width 0.15s ease'
			}}
		>
		</div>;
	},
});

export default Phase;
export { phase };