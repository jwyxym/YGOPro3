import mainGame from '@/script/game';
import LFList from '@/script/lflist';
import Deck from './deck';
import { KEYS } from '@/script/constant';

const append = (
	deck : Deck,
	width : number,
	height : number,
	callback : () => void
) : [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>] => {
	const result = [[], [], []] as [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>];
	for (const [index, value] of ['main', 'extra', 'side'].entries()) {
		const el = document.getElementById(value);
		for (const id of deck[value as keyof Deck] as Array<number>) {
			const card = add(id, width, height, el!, callback);
			result[index].push(card);
		}
	}
	return result;
};

const add = (
	id : number,
	width : number,
	height : number,
	el : HTMLElement,
	callback : () => void
) : HTMLDivElement => {
	const card = document.createElement('div');
	card.draggable = true;
	card.classList.add('ygopro3__deck__card', 'font-atk');
	card.style.width = width + 'px';
	card.style.height = height + 'px';
	card.style.backgroundImage = `url('${mainGame.get.card(id).pic}')`;
	card.dataset.id = id.toString();

	const lflist = document.createElement('div');
	lflist.style.opacity = '0';
	lflist.style.width = width * 0.4 + 'px';
	lflist.style.height = width * 0.4 + 'px';
	card.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		remove(e.target);
		callback();
	});
	card.appendChild(lflist);

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
			i.style.borderColor = 'hotpink';
			i.style.color = 'hotpink';
			i.innerText = lf.toString();
			i.style.opacity = '1';
		} else if (gf !== undefined) {
			i.style.borderColor = 'aqua';
			i.style.color = 'aqua';
			i.innerText = gf.toString();
			i.style.opacity = '1';
		} else {
			i.style.opacity = '0';
		}
	}
};

export { append, count, add, remove };
