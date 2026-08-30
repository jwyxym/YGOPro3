import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';

import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import { TYPE } from '@/script/card';

import { COMMAND, LOCATION, POS } from '@/pages/duel/ygo-protocol/network';
import connect from '@/pages/duel/connect';

import Client_Card from './client_card';
import Axis from './axis';

class Activate {
	three : CSS.CSS3DObject;
	btn : HTMLDivElement;
	btns : Map<string, HTMLImageElement>;
	cards : Array<Client_Card>;

	_btnable : boolean = false;
	set btnable (btnable : boolean) {
		if (connect.replay)
			return;
		this._btnable = btnable;
	};
	get btnable () : boolean {
		return this._btnable;
	};

	constructor () {
		this.btns = new Map();
		this.btnable = false;
		const btn = () : HTMLDivElement => {
			const dom = document.createElement('div');
			dom.classList.add('ygopro3__duel__activate');
			for (const i of [
				KEYS.POS_ATTACK,
				KEYS.POS_DEFENCE,
				KEYS.FLIP,
				KEYS.SUMMON,
				KEYS.ATTACK,
				KEYS.MSET,
				KEYS.SSET,
				KEYS.PSUMMON,
				KEYS.SPSUMMON,
				KEYS.ACTIVATE,
				KEYS.SCALE,
			]) {
				const img = document.createElement('img');
				img.classList.add(i);
				img.classList.add('duel__card__btn');
				const srcs = mainGame.get.textures(KEYS.BTN, i) as [string, string];
				img.src = srcs[0];
				img.addEventListener('mouseenter', () => img.src = srcs[1]);
				img.addEventListener('mouseout', () => img.src = srcs[0]);
				dom.appendChild(img);
				this.btns.set(i, img);
			}
			return dom;
		}
		const dom = document.createElement('div');
		this.btn = btn();
		dom.appendChild(this.btn);
		this.three = new CSS.CSS3DObject(dom);
		this.cards = [];
	};

	click =  (target : HTMLElement) : void => {
		if (connect.duel.select.chk() || !this.btnable) return;
		const option = (effect : Array<{ desc ?: number; index : number; }>, key : string, command : number) => {
			const array = effect
				.map(i => mainGame.get.desc(i.desc ?? - 1));
			connect.duel.select.option.cancelable = true;
			connect.duel.select.option.title = mainGame.get.strings.system(555);
			connect.duel.select.option.array = array;
			connect.duel.select.option.show = true;
			connect.duel.select.option.confirm = async (i ?: number) => {
				connect.duel.select.option.show = false;
				i !== undefined ? await connect.response?.(effect[i].index, command)
					: connect.duel.select.cards.show = !!this.cards
						.filter(i => i.get.activate(key).length > 0)
						.length;
			}
		};
		for (const j of [
			{ key : KEYS.ACTIVATE, command : COMMAND.ACTIVATE, title : 566 },
			{ key : KEYS.ATTACK, command : COMMAND.ATTACK, title : 555 },
			{ key : KEYS.MSET, command : COMMAND.MSET, title : 510 },
			{ key : KEYS.SSET, command : COMMAND.SSET, title : 510 },
			{ key : KEYS.POS_ATTACK, command : COMMAND.REPOS, title : 528 },
			{ key : KEYS.POS_DEFENCE, command : COMMAND.REPOS, title : 528 },
			{ key : KEYS.FLIP, command : COMMAND.REPOS, title : 528 },
			{ key : KEYS.SUMMON, command : COMMAND.SUMMON, title : 508 },
			{ key : KEYS.PSUMMON, command : COMMAND.SPSUMMON, title : 509 },
			{ key : KEYS.SPSUMMON, command : COMMAND.SPSUMMON, title : 509 },
			{ key : KEYS.SCALE, command : COMMAND.ACTIVATE, title : 566 }
		])
			if (target.classList.contains(j.key)) {
				if (this.cards[0].location & (LOCATION.ONFIELD | LOCATION.HAND)) {
					if (this.cards[0].get.activate(j.key).length > 1)
						option(this.cards[0].get.activate(j.key), j.key, j.command);
					else
						connect.response?.(this.cards[0].get.activate(j.key)[0].index, j.command);
				} else {
					const c = this.cards
						.filter(i => i.get.activate(j.key).length > 0);
					connect.duel.select.cards.cancelable = true;
					connect.duel.select.cards.title = mainGame.get.strings.system(j.title);
					connect.duel.select.cards.min = 1;
					connect.duel.select.cards.max = 1;
					connect.duel.select.cards.cards = c;
					connect.duel.select.cards.selected.length = 0;
					connect.duel.select.cards.confirm = async (i : Client_Card) => {
						connect.duel.select.cards.show = false;
						const activate = i.get.activate(j.key);
						activate.length > 1 ? option(activate, j.key, j.command)
							: await connect.response?.(activate[0].index, j.command);
					};
					connect.duel.select.cards.show = true;
				}
			}
	};

	on = (c : Client_Card, cards : Array<Client_Card>) : void => {
		this.cards = cards.length ? cards.slice() : [c];
		const axis = Axis.computed.card(c);
		this.three.position.set(axis.x, axis.y + (c.location & LOCATION.HAND ? 80 : 5), 100);
		this.btn.classList.add('show');
		const ACTIVATE : Array<{ desc ?: number; index : number; }> = [];
		const SUMMON : Array<{ desc ?: number; index : number; }> = [];
		const SPSUMMON : Array<{ desc ?: number; index : number; }> = [];
		const SSET : Array<{ desc ?: number; index : number; }> = [];
		const MSET : Array<{ desc ?: number; index : number; }> = [];
		const REPOS : Array<{ desc ?: number; index : number; }> = [];
		const ATTACK : Array<{ desc ?: number; index : number; }> = [];
		this.cards.forEach(i => {
			ACTIVATE.push(...i.activatable.get(COMMAND.ACTIVATE)!);
			SUMMON.push(...i.activatable.get(COMMAND.SUMMON)!);
			SPSUMMON.push(...i.activatable.get(COMMAND.SPSUMMON)!);
			SSET.push(...i.activatable.get(COMMAND.SSET)!);
			MSET.push(...i.activatable.get(COMMAND.MSET)!);
			REPOS.push(...i.activatable.get(COMMAND.REPOS)!);
			ATTACK.push(...i.activatable.get(COMMAND.ATTACK)!);
		});
		const elements : Array<[HTMLDivElement, number]> = [];
		const is_pendulum = (c.location & LOCATION.SZONE) && [0, 4].includes(c.seq) && c.type & TYPE.PENDULUM;

		elements.push([this.btns.get(KEYS.SCALE)!, Number(!!ACTIVATE.find(i => i.desc === 1160))]);
		elements.push([this.btns.get(KEYS.ACTIVATE)!, Number(!!ACTIVATE.find(i => i.desc !== 1160))]);
		elements.push([this.btns.get(KEYS.SUMMON)!, Number(!!SUMMON.length)]);
		elements.push([this.btns.get(KEYS.PSUMMON)!, is_pendulum ? Number(!!SPSUMMON.length) : 0]);
		elements.push([this.btns.get(KEYS.SPSUMMON)!, is_pendulum ? 0 : Number(!!SPSUMMON.length)]);
		elements.push([this.btns.get(KEYS.SSET)!, Number(!!SSET.length)]);
		elements.push([this.btns.get(KEYS.MSET)!, Number(!!MSET.length)]);
		elements.push([this.btns.get(KEYS.ATTACK)!, Number(!!ATTACK.length)]);
		elements.push([this.btns.get(c.pos & POS.FACEDOWN
				? KEYS.FLIP : c.pos & POS.ATTACK
					? KEYS.POS_DEFENCE : KEYS.POS_ATTACK
			)!,
			Number(!!REPOS.length)]
		);
		elements.forEach(i => this.btnable && i[1]
			? i[0].classList.add('show')
			: i[0].classList.remove('show')
		);
	};

	off = () : void => {
		this.cards.length = 0;
		this.three.position.set(0, 0, - 100);
		this.btn.classList.remove('show');
		this.btns.forEach(i => i.classList.remove('show'));
	};
	
	contains = (target : HTMLElement) : boolean => this.three.element.contains(target);
}

export default Activate;