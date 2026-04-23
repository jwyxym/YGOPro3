<template>
	<main ref = 'deck'
		:style = "{ '--width' : `${width}px`, '--height' : `${height}px` }"
	>
		<div
			:style = "{
				'--height' : `${
					(
						page.size.main
						+ page.size.extra
						+ page.size.side
					)
					* page.size.height
				}px`
			}"
		>
			<Pic
				v-for = 'i in [...page.deck.main, ...page.deck.extra, ...page.deck.side]'
				:key = 'i.key'
				:id = 'i.key'
				:i = 'i'
				:hover = 'page.move.card === i'
				:size = 'page.size'
				:count = 'count'
				:lflist = 'lflist'
				ref = 'cards'
			/>
			<span ref = 'main_title'>{{ page.title.main }}&nbsp;:&nbsp;{{ page.deck.main.length }}
				<span v-if = 'props.lflist?.genesys'>&nbsp;&nbsp;&nbsp;&nbsp;{{ page.deck.genesys }}/{{ props.lflist?.genesys }}</span>
			</span>
			<div class = 'box'
				:style = "{
					'--box_height' : `${page.size.main * page.size.height}px`,
				}"
				:class = "{
					'can_in' : page.move.now.deck === 0 && page.move.now.chk === true && page.move.card,
					'can_not_in' : page.move.now.deck === 0 && page.move.now.chk !== true && page.move.card
				}"
			>
				<span>
					{{ typeof page.move.now.chk === 'string' ? page.move.now.chk : '' }}
				</span>
			</div>
			<span ref = 'extra_title'>{{ page.title.extra }}&nbsp;:&nbsp;{{ page.deck.extra.length }}</span>
			<div class = 'box'
				:style = "{
					'--box_height' : `${ page.size.extra * page.size.height}px`
				}"
				:class = "{
					'can_in' : page.move.now.deck === 1 && page.move.now.chk === true && page.move.card,
					'can_not_in' : page.move.now.deck === 1 && page.move.now.chk !== true && page.move.card
				}"
			>
				<span>
					{{ typeof page.move.now.chk === 'string' ? page.move.now.chk : '' }}
				</span>
			</div>
			<span ref = 'side_title'>{{ page.title.side }}&nbsp;:&nbsp;{{ page.deck.side.length }}</span>
			<div class = 'box'
				:style = "{
					'--box_height' : `${page.size.side * page.size.height}px`
				}"
				:class = "{
					'can_in' : page.move.now.deck === 2 && page.move.now.chk === true && page.move.card,
					'can_not_in' : page.move.now.deck === 2 && page.move.now.chk !== true && page.move.card
				}"
			>
				<span>
					{{ typeof page.move.now.chk === 'string' ? page.move.now.chk : '' }}
				</span>
			</div>
		</div>
	</main>
</template>
<script setup lang = 'ts'>
	import { computed, onMounted, onUnmounted, reactive, ref, watch, ComponentPublicInstance } from 'vue';
	import mainGame from '@/script/game';
	import * as CONSTANT from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Card from '@/script/card';
	import GLOBAL from '@/script/scale';
	import LFList from '@/script/lflist';
	import Deck from '@/pages/deck/deck';
	import { toast } from '@/pages/toast/toast';
	import Pic, { CardPic, CardPics } from '@/pages/deck/pic.vue';

	const deck = ref<HTMLElement | null>(null);
	const main_title = ref<HTMLElement | null>(null);
	const extra_title = ref<HTMLElement | null>(null);
	const side_title = ref<HTMLElement | null>(null);
	const cards = ref<Array<ComponentPublicInstance> | null>(null);
	
	const page = reactive({
		deck : {
			genesys : computed(() => {
				const decks : CardPics = page.deck.main
					.concat(page.deck.extra)
					.concat(page.deck.side);
				return decks.reduce((c, card) => {
					const genesys = props.lflist?.genesys ? props.lflist.get.glist(card.code) : 0;
					return genesys + c;
				}, 0);
			}),
			main : [] as CardPics,
			extra : [] as CardPics,
			side : [] as CardPics,
			add : (code : number, deck : 0 | 1 | 2, index ?: number) => {
				const err = page.deck.check(code, deck);
				if (typeof err === 'string') {
					toast.error(err);
					return;
				}
				const decks = [page.deck.main, page.deck.extra, page.deck.side];
				index = index ?? decks[deck].length;
				decks[deck].push({
					code : code,
					index : index,
					y : 0,
					loc : 0,
					key : code.toString() + index + Math.random()
				});
			},
			check : (code : number | string, deck : 0 | 1 | 2) : true | string => {
				const card : Card = mainGame.get.card(code);
				code = Math.abs(card.alias - card.id) <= 20 ? card.alias : card.id;
				if (card.is_token())
					return mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_TYPE);
				const cards = page.deck.main.concat(page.deck.extra, page.deck.side);
				const ct = props.lflist?.get.lflist(card.id) ?? mainGame.get.system(CONSTANT.KEYS.SETTING_CT_CARD) as number;
				if (cards.filter(i => (() : number => {
					const card : Card = mainGame.get.card(i.code);
					return Math.abs(card.alias - card.id) <= 20 ? card.alias : card.id;
				})() === code).length >= ct + (page.move.index.from > -1 ? 1 : 0))
					return mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_MAX, ct.toString());
				const chk = page.move.index.from === deck ? 0 : 1;
				const genesys = Number(page.move.index.from < 0) * (props.lflist?.genesys ? props.lflist.get.glist(card.id) : 0);
				if (props.lflist && page.deck.genesys + genesys > props.lflist.genesys)
					return mainGame.get.text(I18N_KEYS.DECK_RULE_GENESYS_MAX, props.lflist.genesys);
				switch (deck) {
					case 0:
						if (page.deck.main.length + chk > (mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_MAIN) as number))
							return mainGame.get.text(I18N_KEYS.DECK_RULE_DECK_MAX, mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_MAIN) as number);
						else if (card.is_ex())
							return mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_TYPE);
						return true;
					case 1:
						if (page.deck.extra.length + chk > (mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_EX) as number))
							return mainGame.get.text(I18N_KEYS.DECK_RULE_DECK_MAX, mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_EX) as number);
						else if (!card.is_ex())
							return mainGame.get.text(I18N_KEYS.DECK_RULE_CARD_TYPE);
						return true;
					case 2:
						if (page.deck.side.length + chk > (mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_SIDE) as number))
							return mainGame.get.text(I18N_KEYS.DECK_RULE_DECK_MAX, mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_SIDE) as number);
						return true;
				}
			}
		},
		title : {
			main : '',
			extra : '',
			side : ''
		},
		size : {
			width : 0,
			height : 0,
			main : computed(() : number => Math.max((Math.trunc(page.deck.main.length / props.count) + 1), 6)),
			extra : computed(() : number => Math.max((Math.trunc(page.deck.extra.length / props.count) + 1), 2)),
			side : computed(() : number => Math.max((Math.trunc(page.deck.side.length / props.count) + 1), 2)),
			resize : async () : Promise<void> => {
				page.size.width = (props.width - 24) / props.count;
				page.size.height = page.size.width * 1.45;
				
				const extra_y = page.size.main;
				const side_y = extra_y + page.size.extra;
				const loc = main_title.value!.getBoundingClientRect().height + 2;
				await mainGame.sleep(100);
				page.deck.main.forEach(i => { i.y = 0; i.loc = loc / GLOBAL.SCALE; }); 
				page.deck.extra.forEach(i => { i.y = extra_y; i.loc = (loc * 2 + 2) / GLOBAL.SCALE; }); 
				page.deck.side.forEach(i => { i.y = side_y; i.loc = (loc * 3 + 4) / GLOBAL.SCALE; });
			}
		},
		move : {
			index : {
				x : 0,
				y : 0,
				deck : -1 as -1 | 0 | 1 | 2,
				from : -1 as -1 | 0 | 1 | 2,
			},
			now : {
				deck : -1 as -1 | 0 | 1 | 2,
				chk : true as string | true
			},
			moving : false,
			main : [] as CardPics,
			extra : [] as CardPics,
			side : [] as CardPics,
			on : undefined as undefined | number,
			card : undefined as undefined | CardPic,
			target : undefined as undefined | HTMLElement,
			sort : (a : CardPic, b : CardPic) : number => a.index - b.index,
			resort : (arr : CardPics) => {
				arr = arr.sort(page.move.sort);
				arr.forEach((i, v) => {
					if (i.index !== v)
						i.index = v;
				});
			},
			start : (target : HTMLElement, code ?: number) => {
				const v : number = cards.value?.findIndex(i => i.$el.contains(target)) ?? -1;
				if (v < 0) {
					if (code) {
						page.move.card = { code: code, index: 0, y: 0, loc: 0, key: code.toString() + 0 + Math.random() };
						page.move.main = page.deck.main.slice().sort(page.move.sort);
						page.move.extra = page.deck.extra.slice().sort(page.move.sort);
						page.move.side = page.deck.side.slice().sort(page.move.sort);
					}
					return;
				}
				page.move.main = page.deck.main.slice().sort(page.move.sort);
				page.move.extra = page.deck.extra.slice().sort(page.move.sort);
				page.move.side = page.deck.side.slice().sort(page.move.sort);
				page.move.card = page.move.main.concat(page.move.extra, page.move.side).find(i => target.id === i.key);
				page.move.target = cards.value![v].$el;
				[page.deck.main, page.deck.extra, page.deck.side].forEach((i, v) => {
					if (i.includes(page.move.card!))
						page.move.index.from = v as 0 | 1 | 2;
				});
				page.move.index.deck = page.move.index.from;
			},
			move : (x : number, y : number) => {
				if (!page.move.card || !deck.value || page.move.moving) return;
				page.move.moving = true;
				const decks = [page.move.main, page.move.extra, page.move.side];
				const moveout = () => {
					if (page.move.index.deck > -1)
						page.move.resort(decks[page.move.index.deck]);
					page.move.index.deck = -1;
					page.move.now.deck = -1;
					page.move.now.chk = true;
				}
				const pos = deck.value.getBoundingClientRect();
				if (y > pos.bottom && !page.move.on) {
					deck.value!.scrollTop += window.innerHeight;
					page.move.on = setInterval(() => {
						deck.value!.scrollTop += window.innerHeight;
					}, 400);
				}
				else if (y < pos.top && !page.move.on) {
					deck.value!.scrollTop -= window.innerHeight;
					page.move.on = setInterval(() => {
						deck.value!.scrollTop -= window.innerHeight;
					}, 400);
				} else {
					if (page.move.on) {
						clearInterval(page.move.on);
						page.move.on = undefined;
					}
					if (x > pos.left && x < pos.right) {
						const pic_x = Math.trunc((x - pos.left) / (page.size.width * GLOBAL.SCALE));
						const height = main_title.value!.getBoundingClientRect().height;
						let top = y - height;
						const extra_top = extra_title.value!.getBoundingClientRect().top;
						const side_top = side_title.value!.getBoundingClientRect().top;
						if (y > extra_top)
							top -= height;
						if (y > side_top)
							top -= height;
						const pic_y = Math.trunc((top - pos.top + deck.value!.scrollTop) / (page.size.height * GLOBAL.SCALE));
						if (page.move.index.x === pic_x && page.move.index.y === pic_y)
							return page.move.moving = false;
						page.move.index.x = pic_x;
						page.move.index.y = pic_y;
						const sort = (arr : CardPics, index : number) => {
							if (index >= arr.length) index = arr.length - (arr.includes(page.move.card!) ? 1 : 0);
							let v = 0;
							arr.forEach(i => {
								if (v === index)
									v ++;
								if (page.move.card !== i) {
									i.index = v;
									v ++;
								}
							});
							page.move.card!.index = index;
						}
						if (pic_y < 0)
							moveout();
						else if (pic_y < page.size.main) {
							if (page.move.now.deck !== 0) {
								page.move.now.deck = 0;
								page.move.now.chk = page.deck.check(page.move.card.code, page.move.now.deck);
							}
							if (typeof page.move.now.chk === 'string')
								return page.move.moving = false;
							const index = pic_y * props.count + pic_x;
							if (page.move.index.deck > -1 && page.move.index.deck !== 0)
								page.move.resort(decks[page.move.index.deck]);
							page.move.index.deck = 0;
							sort(page.move.main, index);
						} else if (pic_y < page.size.main + page.size.extra) {
							if (page.move.now.deck !== 1) {
								page.move.now.deck = 1;
								page.move.now.chk = page.deck.check(page.move.card.code, page.move.now.deck);
							}
							if (typeof page.move.now.chk === 'string')
								return page.move.moving = false;
							const index = (pic_y - page.size.main) * props.count + pic_x;
							if (page.move.index.deck > -1 && page.move.index.deck !== 1)
								page.move.resort(decks[page.move.index.deck]);
							page.move.index.deck = 1;
							sort(page.move.extra, index);
						} else {
							if (page.move.now.deck !== 2) {
								page.move.now.deck = 2;
								page.move.now.chk = page.deck.check(page.move.card.code, page.move.now.deck);
							}
							if (typeof page.move.now.chk === 'string')
								return page.move.moving = false;
							const index = (pic_y - page.size.main - page.size.extra) * props.count + pic_x;
							if (page.move.index.deck > -1 && page.move.index.deck !== 2)
								page.move.resort(decks[page.move.index.deck]);
							page.move.index.deck = 2;
							sort(page.move.side, index);
						}
					} else moveout();
				}
				page.move.moving = false;
			},
			end : async () : Promise<void> => {
				if (!page.move.card) return;
				const decks = [page.deck.main, page.deck.extra, page.deck.side];
				if (page.move.index.deck !== page.move.index.from && page.move.index.deck >= 0) {
					decks[page.move.index.deck].push(page.move.card);
					if (page.move.index.from > -1) {
						const ct = decks[page.move.index.from].indexOf(page.move.card!);
						decks[page.move.index.from].splice(ct, 1);
						page.move.resort(decks[page.move.index.from]);
					}
					page.size.resize();
				} else if (page.move.index.deck < 0 && page.move.index.from > -1) {
					const ct = decks[page.move.index.from].indexOf(page.move.card!);
					decks[page.move.index.from][ct].loc = 0;
					await mainGame.sleep(100);
					decks[page.move.index.from].splice(ct, 1);
					page.move.resort(decks[page.move.index.from]);
				}
				if (page.move.target)
					page.move.target = undefined;
				await mainGame.sleep(100);
				page.move.now.deck = -1;
				page.move.now.chk = true;
				page.move.card = undefined;
				page.move.main.length = 0;
				page.move.extra.length = 0;
				page.move.side.length = 0;
				page.move.index.deck = -1;
				page.move.index.from = -1;
				if (page.move.on) {
					clearInterval(page.move.on);
					page.move.on = undefined;
				}
			},
			touchstart : (e : TouchEvent) => page.move.start(e.target as HTMLElement),
			touchmove : (e : TouchEvent) => page.move.move(e.touches[0].clientX, e.touches[0].clientY),
			touchend : async () : Promise<void> => await page.move.end(),
			mousedown : (e : MouseEvent) => e.button === 2 ? false : page.move.start(e.target as HTMLElement),
			mousemove : (e : MouseEvent) => page.move.move(e.clientX, e.clientY),
			mouseup : async () : Promise<void> => await page.move.end()
		}
	});

	onMounted(async () => {
		await mainGame.load.pic(props.deck);
		for (let i = 0; i < props.deck.main.length; i++)
			page.deck.main.push({ code : props.deck.main[i], index : i, y : 0, loc : 0, key : props.deck.main[i].toString() + i + Math.random()});
		for (let i = 0; i < props.deck.extra.length; i++)
			page.deck.extra.push({ code : props.deck.extra[i], index : i, y : 0, loc : 0, key : props.deck.main[i].toString() + i + Math.random()});
		for (let i = 0; i < props.deck.side.length; i++)
			page.deck.side.push({ code : props.deck.side[i], index : i, y : 0, loc : 0, key : props.deck.main[i].toString() + i + Math.random()});
		
		page.title.main = mainGame.get.text(I18N_KEYS.DECK_MAIN);
		page.title.extra = mainGame.get.text(I18N_KEYS.DECK_EXTRA);
		page.title.side = mainGame.get.text(I18N_KEYS.DECK_SIDE);
		page.size.resize();
		window.addEventListener('mousedown', page.move.mousedown);
		window.addEventListener('mousemove', page.move.mousemove);
		window.addEventListener('mouseup', page.move.mouseup);
		window.addEventListener('touchstart', page.move.touchstart);
		window.addEventListener('touchmove', page.move.touchmove);
		window.addEventListener('touchend', page.move.touchend);
		
	});

	onUnmounted(() => {
		window.removeEventListener('mousedown', page.move.mousedown);
		window.removeEventListener('mousemove', page.move.mousemove);
		window.removeEventListener('mouseup', page.move.mouseup);
		window.removeEventListener('touchstart', page.move.touchstart);
		window.removeEventListener('touchmove', page.move.touchmove);
		window.removeEventListener('touchend', page.move.touchend);
	});

	const emit = defineEmits<{
		card : [card : number];
	}>();

	const props = defineProps<{
		width : number;
		height : number;
		count : number;
		deck : Deck;
		lflist ?: LFList;
	}>();

	const deck_export = {
		sort : () : void => {
			const sort = (a : CardPic, b : CardPic) : number => {
				const card = {
					a : mainGame.get.card(a.code),
					b : mainGame.get.card(b.code)
				};
				return card.a.level === card.b.level ? card.a.id - card.b.id : card.b.level - card.a.level;
			};
			[page.deck.main, page.deck.extra, page.deck.side]
				.forEach(deck => {
					deck.sort(sort);
					deck.forEach((i, v) => {
						if (i.index !== v)
							i.index = v;
					});
				});
		},
		clear : () : void => [page.deck.main, page.deck.extra, page.deck.side]
			.forEach(i => i.length = 0),
		disrupt : () : void => {
			const sort = () : number =>  Math.random() - 0.5;
			[page.deck.main, page.deck.extra, page.deck.side]
				.forEach(deck => {
					deck.sort(sort);
					deck.forEach((i, v) => {
						if (i.index !== v)
							i.index = v;
					});
				});
		},
		to_deck : (name : string) : Deck => new Deck({
			main : page.deck.main.slice().sort((a, b) => a.index - b.index).map(i => i.code),
			extra : page.deck.extra.slice().sort((a, b) => a.index - b.index).map(i => i.code),
			side : page.deck.side.slice().sort((a, b) => a.index - b.index).map(i => i.code),
			name : name
		}),
		hover : page.move.start
	};

	watch(() => page.move.card, (n) => {
		if (!n || !(page.deck.main.includes(n) || page.deck.extra.includes(n) || page.deck.side.includes(n)))
			return;
		emit('card', n.code);
	});

	watch(() => GLOBAL.SCALE, page.size.resize);

	defineExpose<{
		clear : () => void;
		sort : () => void;
		disrupt : () => void;
		to_deck : (name : string) => Deck;
		hover : Hover
	}>(deck_export);

	type Hover = (target : HTMLElement, code ?: number) => void;
	export type { Hover };
</script>
<style scoped lang = 'scss'>
	main {
		width: var(--width) !important;
		height: var(--height) !important;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
		color: white;
		> div {
			position: relative;
			width: calc(100% - 20px);
			height: 100%;
			.box {
				height: var(--box_height);
				width: 100%;
				transition: all 0.1s ease;
				border: white 2px solid;
				user-select: none;
				color: rgba($color: red, $alpha: 0);
				display: flex;
				justify-content: center;
				align-items: center;
				&::after {
					content: '';
					background: rgba(255, 255, 255, 0);
				}
			}
			.can_in {
				border: blue 2px solid;
			}
			.can_not_in {
				border: red 2px solid;
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
		}
		&::-webkit-scrollbar {
			opacity: 0;
			height: 10px;
		}
		&::-webkit-scrollbar-thumb {
			background: black;
			border: 2px solid gray;
			border-radius: 8px;
		}
	}
</style>