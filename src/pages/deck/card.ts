import mainGame from '@/script/game';
import LFList from '@/script/lflist';
import { KEYS } from '@/script/constant';
import Card from '@/script/card';
import Deck from './deck';

const new_card = (
	id : number | string,
	width : number,
	height : number,
	callback ?: (i : HTMLDivElement) => void
) : HTMLDivElement => {
	const card = document.createElement('div');
	card.draggable = true;
	card.classList.add('ygopro3__deck__card', 'font-atk');
	card.style.width = width + 'px';
	card.style.height = height + 'px';
	card.style.backgroundImage = `url('${mainGame.get.card(id).pic}')`;
	card.dataset.id = typeof id === 'string' ? id : id.toString();

	const lflist = document.createElement('div');
	lflist.style.width = width * 0.4 + 'px';
	lflist.style.height = width * 0.4 + 'px';
	card.appendChild(lflist);
	callback?.(card);
	return card;
};

const new_list = (
	card : Card,
	callback ?: (i : HTMLDivElement) => void
) : HTMLDivElement => {
	const item = document.createElement('div');
	const c = new_card(card.id, 90 / 1.45, 90, callback);
	item.classList.add('ygopro3__deck__list');
	item.dataset.id = c.id.toString();
	const body = document.createElement('div');
	const name = document.createElement('b');
	name.innerText = card.name;
	const id = document.createElement('span');
	id.innerText = card.id.toString();
	body.appendChild(name);
	body.appendChild(id);
	item.appendChild(c);
	item.appendChild(body);
	return item;
};

const append = (
	els : Array<HTMLDivElement>,
	deck : Deck,
	width : number,
	height : number,
	callback : (i : HTMLDivElement) => void
) : [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>] => {
	const result = [[], [], []] as [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>];
	for (const [index, value] of ['main', 'extra', 'side'].entries()) {
		const el = els[index];
		for (const id of deck[value as keyof Deck] as Array<number>) {
			const card = add(id, width, height, el!, callback);
			result[index].push(card);
		}
	}
	return result;
};

const add = (
	id : number | string,
	width : number,
	height : number,
	el : HTMLElement,
	callback : (i : HTMLDivElement) => void
) : HTMLDivElement => {
	const card = new_card(id, width, height, callback);
	el.appendChild(card);
	return card;
};

const remove = (
	target : EventTarget | null
) : HTMLDivElement | undefined => {
	if (!(target instanceof HTMLElement))
		return undefined;
	const card = target.closest('.ygopro3__deck__card') as HTMLDivElement | null;
	card?.remove();
	return card ?? undefined;
};

const get = {
	lf : (lflist : LFList, code : string) : number | undefined => {
		const lf = lflist?.get?.lflist?.(code);
		if (lf !== mainGame.get.system(KEYS.SETTING_CT_CARD))
			return lf;
		return undefined;
	},
	g : (lflist : LFList, code : string) : number | undefined => {
		const g = lflist?.genesys ? lflist.get.glist(code) : undefined;
		return g ? g : undefined;
	}
};

const count = (
	els : Array<HTMLDivElement>,
	lflist ?: LFList) => {
	for (const el of els) {
		const i = el.children[0] as HTMLElement;
		if (!lflist) {
			i.style.opacity = '0';
			continue;
		}
		const id = el.dataset.id!;
		const lf = get.lf(lflist, id);
		const gf = get.g(lflist, id);
		if (lf !== undefined) {
			i.innerText = lf.toString();
			i.classList.remove('gf');
			i.classList.add('lf');
		} else if (gf !== undefined) {
			i.innerText = gf.toString();
			i.classList.remove('lf');
			i.classList.add('gf');
		} else
			i.classList.remove('lf', 'gf');
	}
};

const append_list = (
	target : HTMLElement,
	cards : Array<Card>,
	callback ?: (i : HTMLDivElement) => void
) => {
	for (const c of cards) {
		const item = new_list(c, callback);
		target.appendChild(item);
	}
};

const clear_list = (target : HTMLElement) => target.replaceChildren();

const count_list = (
	target : HTMLElement,
	lflist ?: LFList) => {
	const els = Array.from(target.children) as Array<HTMLDivElement>;
	count(els.map(i => i.children[0] as HTMLDivElement), lflist);
};

export { append, count, add, remove, append_list, clear_list, count_list };
