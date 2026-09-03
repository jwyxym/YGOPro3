<template>
	<div
		ref = 'deck'
		class = 'drag no-scrollbar'
		:style = "{
			'--width' : `${width}px`,
			'--height' : `${height}px`
		}"
	>
		<div
			v-for = "(item, v) in [
				{ name : 'main', i18n : I18N_KEYS.DECK_MAIN },
				{ name : 'extra', i18n : I18N_KEYS.DECK_EXTRA },
				{ name : 'side', i18n : I18N_KEYS.DECK_SIDE }
			]"
			:style = "{ '--min_height' : `${(v ? 1 : 2) * page.height}px` }"
			class = 'group'
		>
			<span>{{ mainGame.get.text(item.i18n) }}&nbsp;:&nbsp;{{ page.count[v] }}
				<span v-if = 'props.lflist?.genesys && !v'>&nbsp;&nbsp;&nbsp;&nbsp;{{ page.genesys }}/{{ props.lflist?.genesys }}</span>
			</span>
			<div
				ref = 'group'
				:id = 'item.name'
				@dragstart = 'drag.start($event)'
				@dragenter = "drag.enter($event, item.name as 'main' | 'extra' | 'side')"
				@dragover.prevent = 'drag.scroll($event)'
				@dragleave = 'drag.leave($event)'
				@dragend.prevent = 'drag.end($event)'
				@contextmenu.prevent = 'drag.remove($event)'
			>
				<span/>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { nextTick, onMounted, reactive, useTemplateRef, watch } from 'vue';

	import mainGame from '@/script/game';
	import LFList from '@/script/lflist';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Card, { TYPE } from '@/script/card';
	import { KEYS } from '@/script/constant';

	import { toast } from '@/pages/toast/toast';

	import Deck from './deck';
	import * as card from './card';

	const props = defineProps<{
		width : number;
		height : number;
		count : number;
		del : boolean;
		deck : Deck;
		lflist ?: LFList;
	}>();

	const group = useTemplateRef('group');
	const deck = useTemplateRef('deck');
	let cards : [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>] = [[], [], []];

	const drag = {
		card : undefined as HTMLDivElement | undefined,
		list : undefined as HTMLDivElement | undefined,
		on : undefined as undefined | number,
		err : false,
		start : function (e : DragEvent) {
			const card = e.target as HTMLDivElement;
			e.dataTransfer!.effectAllowed = 'move';
			if (!e.currentTarget)
				return;
			window.addEventListener('dragover', this.scroll);
			this.card = card;
			this.list = e.currentTarget as HTMLDivElement | null ?? undefined;
			this.list?.classList.add('move_ok');
			setTimeout(() => {
				(e.target as HTMLElement).classList.add('move');
			}, 0);
		},
		end : function (e : DragEvent) {
			e.dataTransfer!.effectAllowed = 'move';
			if (!this.card)
				return;
			window.removeEventListener('dragover', this.scroll);
			if (this.on) {
				clearInterval(this.on);
				this.on = undefined;
			}
			const in_group = group.value!.some(i => {
				const rect = i.getBoundingClientRect();
				return e.clientX >= rect.left
					&& e.clientX <= rect.right
					&& e.clientY >= rect.top
					&& e.clientY <= rect.bottom;
			});
			if (!in_group)
				this.card.remove();
			this.card.classList.remove('move');
			group.value!.forEach(i => {
				i.classList.remove('move_ok', 'move_err');
				(i.children[0] as HTMLSpanElement).innerText = '';
			});
			this.card = undefined;
			this.list = undefined;
			this.err = false;
			cards = group.value!.map(list => (Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id) as Array<HTMLElement>
				) as [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>];
			page.flush();
		},
		scroll : (e : DragEvent) : void => {
			if (!deck.value)
				return;
			const rect = deck.value.getBoundingClientRect();
			if (e.clientY > rect.bottom && !drag.on) {
				deck.value.scrollTop += window.innerHeight;
				drag.on = setInterval(() => {
					deck.value!.scrollTop += window.innerHeight;
				}, 400) as any as number;
			} else if (e.clientY < rect.top && !drag.on) {
				deck.value.scrollTop -= window.innerHeight;
				drag.on = setInterval(() => {
					deck.value!.scrollTop -= window.innerHeight;
				}, 400) as any as number;
			} else if (e.clientY >= rect.top && e.clientY <= rect.bottom && drag.on) {
				clearInterval(drag.on);
				drag.on = undefined;
			}
		},
		enter : function (e : DragEvent, name : 'main' | 'extra' | 'side') {
			e.dataTransfer!.effectAllowed = 'move';
			const target = e.target as HTMLElement;
			const list = e.currentTarget as HTMLDivElement | null;
			if (target === this.card
				|| !list
				|| !this.card)
				return;
			try {
				if (this.list !== list) {
					if (this.list) {
						this.list.classList.remove('move_ok', 'move_err');
						(this.list.children[0] as HTMLSpanElement).innerText = '';
					}
					const result = this.check(this.card, name);
					list.classList.add(result[0]);
					(list.children[0] as HTMLSpanElement).innerText = result[1];
					this.list = list;
					if (result[1])
						this.err = true;
					else {
						this.err = false;
						list.insertBefore(this.card, target === list ? null : target);
					}
				} else if (target === list && !this.err) {
					list.insertBefore(this.card, null);
				} else if (!this.err) {
					const cards = Array.from((list).children);
					const index = cards.indexOf(target);
					const this_index = cards.indexOf(this.card);
					list.insertBefore(this.card,
						index > this_index ? target.nextElementSibling : target
					);
				}
			} catch {}
		},
		leave : function (e : DragEvent) {
			const list = e.currentTarget as HTMLDivElement | null;
			if (!list)
				return;
			const rect = list.getBoundingClientRect();
			const in_list = e.clientX >= rect.left
				&& e.clientX <= rect.right
				&& e.clientY >= rect.top
				&& e.clientY <= rect.bottom;
			if (in_list)
				return;
			list.classList.remove('move_ok', 'move_err');
			(list.children[0] as HTMLSpanElement).innerText = '';
			if (this.list === list) {
				this.list = undefined;
				this.err = false;
			}
		},
		remove : function (e : MouseEvent) {
			if (!props.del)
				return;
			if (!card.remove(e.target))
				return;
			cards = group.value!.map(list => (Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id) as Array<HTMLElement>
				) as [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>];
			page.flush();
		},
		check : (el : HTMLDivElement | number, name : 'main' | 'extra' | 'side') : [string, string] => {
			const ok : [string, string] = ['move_ok', ''];
			const err = (i : string) : [string, string] => ['move_err', i];
			const get_code = (card : Card) => {
				while (card.alias) {
					const c = mainGame.get.card(card.alias);
					if (c === mainGame.unknown)
						break;
					card = c;
				}
				return card.id;
			};
			const card : Card = mainGame.get.card(typeof el === 'number' ? el : el.dataset.id!);
			if (card.is_token())
				return err(mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_TYPE));
			const code = get_code(card);
			const c = cards.flat();
			const deck_cards = c.map(i => i.dataset.id!);
			const chk = typeof el === 'number' ? 1 : Number(!c.includes(el));
			const ct = props.lflist?.get.lflist(card.id) ?? mainGame.get.system(KEYS.SETTING_CT_CARD) as number;
			if (deck_cards.filter(i => get_code(mainGame.get.card(i)) === code).length + chk > ct)
				return err(mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_MAX, ct.toString()));

			const genesys = chk * (props.lflist?.genesys ? props.lflist.get.glist(card.id) : 0);
			if (props.lflist && (page.genesys + genesys > props.lflist.genesys))
				return err(mainGame.get.text(I18N_KEYS.DECK_RULE_GENESYS_MAX, props.lflist.genesys));
			switch (name) {
				case 'main':
					if (cards[0].length + chk > (mainGame.get.system(KEYS.SETTING_CT_DECK_MAIN) as number))
						return err(mainGame.get.text(I18N_KEYS.DECK_RULE_DECK_MAX, mainGame.get.system(KEYS.SETTING_CT_DECK_MAIN) as number));
					else if (card.is_ex())
						return err(mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_TYPE));
					return ok;
				case 'extra':
					if (cards[1].length + chk > (mainGame.get.system(KEYS.SETTING_CT_DECK_EX) as number))
						return err(mainGame.get.text(I18N_KEYS.DECK_RULE_DECK_MAX, mainGame.get.system(KEYS.SETTING_CT_DECK_EX) as number));
					else if (!card.is_ex())
						return err(mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_TYPE));
					return ok;
				case 'side':
					if (cards[2].length + chk > (mainGame.get.system(KEYS.SETTING_CT_DECK_SIDE) as number))
						return err(mainGame.get.text(I18N_KEYS.DECK_RULE_DECK_MAX, mainGame.get.system(KEYS.SETTING_CT_DECK_SIDE) as number));
					return ok;
			}
		}
	};

	const page = reactive({
		height : 0,
		genesys : 0,
		count : [0, 0, 0],
		flush : function () {
			this.genesys = group.value!
				.flat()
				.map(i => i.dataset.id && props.lflist?.genesys ? props.lflist.get.glist(i.dataset.id) : 0)
				.reduce((acc, cur) => acc + cur, 0);
			this.count = group.value!.map(i => i.children.length - 1);
		}
	});

	watch(() => props.lflist, (n) => card.count(cards.flat(), n));

	onMounted(async () => {
		const width = (props.width - 24) / props.count;
		const height = width * 1.45;
		page.height = height * 2;
		cards = card.append(props.deck, width, height, page.flush);
		card.count(cards.flat(), props.lflist);
		await nextTick();
		page.flush();
	});

	defineExpose<{
		clear : () => void;
		sort : () => void;
		disrupt : () => void;
		to_deck : (name : string) => Deck;
		drag : (target : DragEvent, code ?: number) => void;
		add : (code : number) => void;
	}>({
		sort : () : void => {
			group.value!.forEach(list => {
				(Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id)
					.sort((a : HTMLElement, b : HTMLElement) => {
						const card = {
							a : mainGame.get.card(a.dataset.id!),
							b : mainGame.get.card(b.dataset.id!)
						};
						const type = {
							main : TYPE.MONSTER | TYPE.SPELL | TYPE.TRAP,
							ex : TYPE.LINK | TYPE.XYZ | TYPE.FUSION | TYPE.SYNCHRO
						};
						const type_a = card.a.type & type.main;
						const type_b = card.b.type & type.main;
						const type_a_ex = card.a.type & type.ex;
						const type_b_ex = card.b.type & type.ex;
						return type_a === type_b
							? type_a_ex === type_b_ex
								? card.a.level === card.b.level
									? card.a.id - card.b.id
									: card.b.level - card.a.level
								: type_a_ex - type_b_ex
							: type_a - type_b;
					})
					.forEach(i => list.appendChild(i));
			});
			cards = group.value!.map(list => (Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id) as Array<HTMLElement>
				) as [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>];
			page.flush();
		},
		clear : () : void => {
			group.value!.forEach(list => {
				(Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id)
					.forEach(i => i.remove());
			});
			cards = [[], [], []];
			page.flush();
		},
		disrupt : () : void => {
			group.value!.forEach(list => {
				const deck = (Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id);
				for (let i = deck.length - 1; i > 0; i --) {
					const v = Math.floor(Math.random() * (i + 1));
					[deck[i], deck[v]] = [deck[v], deck[i]];
				}
				deck.forEach(i => list.appendChild(i));
			});
			cards = group.value!.map(list => (Array.from(list.children) as Array<HTMLElement>)
					.filter(i => i.dataset.id) as Array<HTMLElement>
				) as [Array<HTMLDivElement>, Array<HTMLDivElement>, Array<HTMLDivElement>];
			page.flush();
		},
		to_deck : (name : string) : Deck => new Deck({
			main : (Array.from(group.value![0].children) as Array<HTMLElement>)
				.filter(i => i.dataset.id)
				.map(i => Number(i.dataset.id)),
			extra : (Array.from(group.value![1].children) as Array<HTMLElement>)
				.filter(i => i.dataset.id)
				.map(i => Number(i.dataset.id)),
			side : (Array.from(group.value![2].children) as Array<HTMLElement>)
				.filter(i => i.dataset.id)
				.map(i => Number(i.dataset.id)),
			name : name
		}),
		drag : drag.start,
		add : (code : number) => {
			const c = mainGame.get.card(code);
			let deck : 0 | 1 | 2;
			if (c.is_ex())
				deck = cards[1].length < (mainGame.get.system(KEYS.SETTING_CT_DECK_EX) as number)
					? 1 : 2;
			else
				deck = cards[0].length < (mainGame.get.system(KEYS.SETTING_CT_DECK_MAIN) as number)
					? 0 : 2;

			const [_, err] = drag.check(code, ['main', 'extra', 'side'][deck] as 'main' | 'extra' | 'side');
			if (err)
				toast.error(err);
			else {
				const width = (props.width - 24) / props.count;
				const height = width * 1.45;
				const el = card.add(code, width, height, group.value![deck], page.flush);
				cards[deck].push(el);
				card.count([el], props.lflist);
				page.flush();
			}
		}
	});
</script>
<style scoped lang = 'scss'>
	.drag {
		width: var(--width);
		height: var(--height);
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
		color: white;
		display: flex;
		flex-direction: column;
		> div {
			display: flex;
			flex-direction: column;
			> div {
				display: flex;
				flex-wrap: wrap;
				align-content: flex-start;
				min-height: var(--min_height);
				border: white 2px solid;
				span {
					position: absolute;
					left: 50%;
					top: 50%;
					transform: translate(-50%, -50%);
					z-index: 1;
					font-size: 32px;
					user-select: none;
				}
				&.move_ok {
					border-color: blue;
				}
				&.move_err {
					border-color: red;
					color: red;
					position: relative;
					&::after {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%);
						width: 100%;
						height: 100%;
						background: rgba(255, 255, 255, 0.3);
					}
				}
				&::after {
					content: '';
					background: rgba(255, 255, 255, 0);
				}
			}
		}
	}
</style>
