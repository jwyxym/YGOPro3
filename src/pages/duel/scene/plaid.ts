import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import { LOCATION } from '@/pages/duel/ygo-protocol/network';
import connect from '@/pages/duel/connect';

class Plaid {
	three : CSS.CSS3DObject;
	child : HTMLDivElement;
	name : string;
	data : number;
	location : number;
	seq : number;
	disable : boolean;
	forbbiden : boolean;
	selected : boolean;
	owner : 0 | 1;

	static chk = () : boolean => connect.wait.info.duel_rule >= 0 && connect.wait.info.duel_rule <= 3;

	static key = (x : number, y : number) : string => `${x},${y}`;

	static zone = (seq : number, shift : number) : number => (1 << seq) << shift;

	static text = (key : number) : string => mainGame.get.text(key);

	static rule_data : Map<string, number> = new Map([
		[Plaid.key(- 2, - 3), Plaid.zone(0, 8)],
		[Plaid.key(2, - 3), Plaid.zone(4, 8)],
		[Plaid.key(- 2, 3), Plaid.zone(0, 24)],
		[Plaid.key(2, 3), Plaid.zone(4, 24)],
		[Plaid.key(- 2, - 2), 0x8000],
		[Plaid.key(2, - 2), 0x4000],
		[Plaid.key(- 2, 2), 0x800000],
		[Plaid.key(2, 2), 0x400000],
	]);

	static side_data : Map<string, number> = new Map([
		[Plaid.key(3, 1), Plaid.zone(5, 24)],
		[Plaid.key(- 3, - 1), Plaid.zone(5, 8)],
	]);

	static row_data : Map<number, (x : number) => number> = new Map([
		[2, x => Plaid.zone(2 - x, 24)],
		[1, x => Plaid.zone(2 - x, 16)],
		[0, x => x === - 1 ? Plaid.zone(5, 0) | Plaid.zone(6, 16) : Plaid.zone(6, 0) | Plaid.zone(5, 16)],
		[- 1, x => Plaid.zone(x + 2, 0)],
		[- 2, x => Plaid.zone(x + 2, 8)],
	]);

	static rule_target : Map<string, [number, number, 0 | 1]> = new Map([
		[Plaid.key(- 2, 2), [LOCATION.SZONE, 7, 1]],
		[Plaid.key(2, 2), [LOCATION.SZONE, 6, 1]],
		[Plaid.key(- 2, - 2), [LOCATION.SZONE, 6, 0]],
		[Plaid.key(2, - 2), [LOCATION.SZONE, 7, 0]],
	]);

	static side_target : Map<string, [number, number, 0 | 1]> = new Map([
		[Plaid.key(3, 1), [LOCATION.SZONE, 5, 1]],
		[Plaid.key(- 3, - 1), [LOCATION.SZONE, 5, 0]],
	]);

	static row_target : Map<number, (x : number) => [number, number, 0 | 1]> = new Map<number, (x : number) => [number, number, 0 | 1]>([
		[3, x => [LOCATION.SZONE, 2 - x, 1]],
		[2, x => [LOCATION.SZONE, 2 - x, 1]],
		[1, x => [LOCATION.MZONE, 2 - x, 1]],
		[0, x => [LOCATION.MZONE, x > 0 ? 6 : 5, 0]],
		[- 1, x => [LOCATION.MZONE, 2 + x, 0]],
		[- 2, x => [LOCATION.SZONE, 2 + x, 0]],
		[- 3, x => [LOCATION.SZONE, x + 2, 0]],
	]);

	static fixed_name : Map<string, number> = new Map([
		[Plaid.key(- 3, 2), I18N_KEYS.DUEL_LOCATION_DECK],
		[Plaid.key(3, - 2), I18N_KEYS.DUEL_LOCATION_DECK],
		[Plaid.key(- 3, 1), I18N_KEYS.DUEL_LOCATION_GRAVE],
		[Plaid.key(3, - 1), I18N_KEYS.DUEL_LOCATION_GRAVE],
		[Plaid.key(- 3, 0), I18N_KEYS.DUEL_LOCATION_REMOVED],
		[Plaid.key(3, 0), I18N_KEYS.DUEL_LOCATION_REMOVED],
		[Plaid.key(- 3, - 1), I18N_KEYS.DUEL_LOCATION_FIELD],
		[Plaid.key(3, 1), I18N_KEYS.DUEL_LOCATION_FIELD],
		[Plaid.key(- 3, - 2), I18N_KEYS.DUEL_LOCATION_EX_DECK],
		[Plaid.key(3, 2), I18N_KEYS.DUEL_LOCATION_EX_DECK],
	]);

	static row_name : Map<number, (x : number, rule : boolean) => string> = new Map([
		[3, x => `${Plaid.text(I18N_KEYS.DUEL_LOCATION_SZONE)}[${- x + 3}]`],
		[2, (x, rule) => rule && Math.abs(x) === 2
			? `${Plaid.text(I18N_KEYS.DUEL_LOCATION_PZONE)}[${x < 0 ? 1 : 0}]`
			: `${Plaid.text(I18N_KEYS.DUEL_LOCATION_SZONE)}[${- x + 3}]`],
		[1, x => `${Plaid.text(I18N_KEYS.DUEL_LOCATION_MZONE)}[${- x + 3}]`],
		[0, x => `${Plaid.text(I18N_KEYS.DUEL_LOCATION_EX_MZONE)}[${Number(x > 0)}]`],
		[- 1, x => `${Plaid.text(I18N_KEYS.DUEL_LOCATION_MZONE)}[${x + 3}]`],
		[- 2, (x, rule) => rule && Math.abs(x) === 2
			? `${Plaid.text(I18N_KEYS.DUEL_LOCATION_PZONE)}[${Number(x > 0)}]`
			: `${Plaid.text(I18N_KEYS.DUEL_LOCATION_SZONE)}[${x + 3}]`],
		[- 3, x => `${Plaid.text(I18N_KEYS.DUEL_LOCATION_SZONE)}[${x + 3}]`],
	]);

	static get = {
		data : (x : number, y : number, rule : boolean) : number => {
			const key = Plaid.key(x, y);
			if (Math.abs(x) === 3 && (Math.abs(y) !== 1 || x * y <= 0))
				return 0;
			return (rule ? Plaid.rule_data.get(key) : undefined)
				?? Plaid.side_data.get(key)
				?? Plaid.row_data.get(y)?.(x)
				?? 0;
		},
		target : (x : number, y : number, rule : boolean) : [number, number, 0 | 1] => {
			const key = Plaid.key(x, y);
			return (rule ? Plaid.rule_target.get(key) : undefined)
				?? Plaid.side_target.get(key)
				?? Plaid.row_target.get(y)?.(x)
				?? [0, 0, 0];
		},
		name : (x : number, y : number, rule : boolean, owner : 0 | 1) : string => {
			const key = Plaid.key(x, y);
			const location_key = Plaid.fixed_name.get(key);
			const location = location_key
				? Plaid.text(location_key)
				: Plaid.row_name.get(y)?.(x, rule) ?? '';
			const owners = [I18N_KEYS.DUEL_PLAYER_SELF, I18N_KEYS.DUEL_PLAYER_OPPO];
			return `[${Plaid.text(owners[owner])}]${location}`;
		}
	};

	constructor (x : number, y : number) {
		const rule = Plaid.chk();
		const dom = document.createElement('div');
		const child = document.createElement('div');
		child.classList.add('ygopro3__duel__plaid');
		dom.appendChild(child);
		this.child = child;
		this.disable = false;
		this.forbbiden = false;
		this.selected = false;
		this.three = new CSS.CSS3DObject(dom);
		this.data = Plaid.get.data(x, y, rule);
		[this.location, this.seq, this.owner] = Plaid.get.target(x, y, rule);
		this.name = Plaid.get.name(x, y, rule, this.owner);
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
		},
		selected: async () : Promise<void> => {
			this.selected = !this.selected;
			this.child.classList.contains('selected')
				? this.child.classList.remove('selected')
				: this.child.classList.add('selected');
			await mainGame.sleep(200);
		}
	};
}

export default Plaid;
