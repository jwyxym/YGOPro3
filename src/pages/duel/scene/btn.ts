import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { PHASE } from '@/pages/duel/ygo-protocol/network';

class Btn {
	three : CSS.CSS3DObject;
	span : HTMLSpanElement;
	enable : Array<number> = [];

	constructor () {
		const dom = document.createElement('div');
		const child = document.createElement('div');
		const span = document.createElement('span');
		this.span = span;
		child.appendChild(span);
		child.classList.add('ygopro3__duel__btn', 'font-atk');
		dom.appendChild(child);
		this.three = new CSS.CSS3DObject(dom);
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

	phase = async (i : number) : Promise<void> => {
		if (this.span.classList.contains('show')) {
			this.span.classList.remove('show');
			await mainGame.sleep(100);
		}
		this.span.innerText = this.map.get(i) ?? '';
		await mainGame.sleep(100);
		this.span.classList.add('show');
	};
	contains = (target : HTMLElement) : boolean => this.three.element.contains(target);
}

export default Btn;