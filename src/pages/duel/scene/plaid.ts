import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { LOCATION } from '@/pages/duel/ygo-protocol/network';

class Plaid {
	three : CSS.CSS3DObject;
	child : HTMLDivElement;
	name : string;
	data : number;
	location : number;
	seq : number;
	disable : boolean;
	forbbiden : boolean;
	owner : 0 | 1;

	constructor (x : number, y : number) {
		const dom = document.createElement('div');
		const child = document.createElement('div');
		child.classList.add('ygopro3__duel__plaid');
		dom.appendChild(child);
		this.child = child;
		this.disable = false;
		this.forbbiden = false;
		this.three = new CSS.CSS3DObject(dom);
		this.data = Math.abs(x) === 3 ?
			(() : number  => {
				if (x * y <= 0 || Math.abs(y) !== 1)
					return 0;
				return 0x20 << (y < 0 ? 8 : 24);
			})() : (() : number => {
				let location : string = '1';
				if (y > 0) {
					location += '0'.repeat(- x + 2);
					return parseInt(location, 2) << ((y + 1) * 8);
				} else if (y === 0) {
					return x === -1 ? (() : number => {
						return 0x20 | (0x40 << 16);
					})()
					: (() : number => {
						return 0x40 | (0x20 << 16);
					})()
				} else {
					location += '0'.repeat(x + 2);
					return parseInt(location, 2) << ((- 1 - y) * 8);
				}
			})();
		[this.location, this.seq, this.owner] = Math.abs(x) === 3 ?
			(() : [number, number, 0 | 1]  => {
				if (x * y <= 0 || Math.abs(y) !== 1)
					return [0, 0, 0];
				return [LOCATION.SZONE, 5, y < 0 ? 0 : 1];
			})() : (() : [number, number, 0 | 1] => {
				switch (y) {
					case 2:
						return [LOCATION.SZONE, 2 - x, 1];
					case 1:
						return [LOCATION.MZONE, 2 - x, 1];
					case -1:
						return [LOCATION.MZONE, 2 + x, 0];
					case -2:
						return [LOCATION.SZONE, x + 2, 0];
					default:
						return [LOCATION.MZONE, x > 0 ? 6 : 5, 0];
				}
			})();
		const owners = [I18N_KEYS.DUEL_PLAYER_SELF, I18N_KEYS.DUEL_PLAYER_OPPO];
		this.name = `[${mainGame.get.text(owners[this.owner])}]${(() : string => {
			if ((x === -3 && y === 2) || (x === 3 && y === -2))
				return mainGame.get.text(I18N_KEYS.DUEL_LOCATION_DECK)
			else if ((x === -3 && y === 1) || (x === 3 && y === -1))
				return mainGame.get.text(I18N_KEYS.DUEL_LOCATION_GRAVE)
			else if ((x === -3 && y === 0) || (x === 3 && y === 0))
				return mainGame.get.text(I18N_KEYS.DUEL_LOCATION_REMOVED)
			else if ((x === -3 && y === -1) || (x === 3 && y === 1))
				return mainGame.get.text(I18N_KEYS.DUEL_LOCATION_FIELD)
			else if ((x === -3 && y === -2) || (x === 3 && y === 2))
				return mainGame.get.text(I18N_KEYS.DUEL_LOCATION_EX_DECK)
			else if (y === -2)
				return `${mainGame.get.text(I18N_KEYS.DUEL_LOCATION_SZONE)}[${x + 2}]`
			else if (y === 2)
				return `${mainGame.get.text(I18N_KEYS.DUEL_LOCATION_SZONE)}[${- x + 2}]`
			else if (y === -1)
				return `${mainGame.get.text(I18N_KEYS.DUEL_LOCATION_MZONE)}[${x + 2}]`
			else if (y === 1)
				return `${mainGame.get.text(I18N_KEYS.DUEL_LOCATION_MZONE)}[${-x + 2}]`
			else if (y === 0)
				return `${mainGame.get.text(I18N_KEYS.DUEL_LOCATION_EX_MZONE)}[${x > 0 ? 1 : 0}]`
			return '';
		})()}`;
	};

	set = {
		disable : async () : Promise<void> => {
			this.disable = !this.disable;
			this.child.classList.contains('disable')
				? this.child.classList.remove('disable')
				: this.child.classList.add('disable');
			await mainGame.sleep(200);
		},
		forbbiden : async () : Promise<void> => {
			this.forbbiden = !this.forbbiden;
			this.child.classList.contains('forbbiden')
				? this.child.classList.remove('forbbiden')
				: this.child.classList.add('forbbiden');
			await mainGame.sleep(200);
		}
	};
}

export default Plaid;