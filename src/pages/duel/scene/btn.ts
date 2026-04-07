import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { PHASE } from '@/pages/duel/ygo-protocol/network';
import * as SIZE from './scene-size';

class Btn {
	three : CSS.CSS3DObject;
	span : HTMLSpanElement;
	enable : Array<number> = [];

	constructor () {
		const dom = document.createElement('div');
		const child = document.createElement('div');
		Object.assign(child.style, {
			width : `${SIZE.HEIGHT}px`,
			height : `${SIZE.HEIGHT / 3}px`,
			color : '#9ed3ff',
			textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
			fontSize : '17px',
			fontFamily : 'AtkDef',
			display : 'flex',
			alignItems : 'center',
			justifyContent : 'center',
			border : '2px solid #9ed3ff'
		});
		const span = document.createElement('span');
		Object.assign(span.style, {
			opacity : '0',
			transition : 'all 0.1s ease'
		});
		this.span = span;
		child.appendChild(span);
		dom.appendChild(child);
		this.three = new CSS.CSS3DObject(dom);
		// dom.addEventListener('click', async () => {
		// })
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
		if (this.span.style.opacity === '1') {
			this.span.style.opacity = '0';
			await mainGame.sleep(100);
		}
		this.span.innerText = this.map.get(i) ?? '';
		await mainGame.sleep(100);
		this.span.style.opacity = '1';
	};
}

export default Btn;