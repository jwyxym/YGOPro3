<template>
	<main class = 'deck'>
		<Card_Box
			:height = 'page.height'
			:width = 'page.width[0]'
			:code = 'page.card'
			@card = 'page.oncard'
		/>
		<Deck_Box
			:height = 'page.height'
			:width = 'page.width[1]'
			:count = '10'
			:deck = 'this_deck'
			:lflist = 'page.lflist'
			@card = 'page.oncard'
			@move = 'page.move.on'
			@hover = '(hover : Hover) => page.hover = hover'
			@deck = '(deck : [CardPics, CardPics, CardPics]) => page.deck = deck'
		/>
		<Search_Box
			:height = 'page.height'
			:width = 'page.width[0]'
			:count = '10'
			:hover = 'page.hover!'
			:move = 'page.move'
			:deck = 'this_deck'
			@card = 'page.oncard'
			@lflist = '(lflist : string) => page.lflist = lflist'
			@save = 'page.save'
			@sort = 'page.sort'
			@share = 'page.copy'
			@disrupt = 'page.disrupt'
			@clear = 'page.clear'
			@exit = "emit('exit')"
		/>
	</main>
</template>
<script setup lang = 'ts'>
	import { reactive, onBeforeMount, onUnmounted } from 'vue';

	import mainGame from '@/script/game';
	import * as CONSTANT from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import fs from '@/script/fs';

	import Dialog from '@/pages/ui/dialog';
	import Deck_Box, { Hover } from '@/pages/ui/deck.vue';
	import Card_Box from '@/pages/ui/card_info.vue';
	import { CardPic, CardPics } from '@/pages/ui/pic.vue';
	import { toast } from '@/pages/toast/toast';

	import Deck from './deck';
	import Search_Box from './searcher.vue';

	const page = reactive({
		lflist : '',
		height : 0,
		width : new Array(2).fill(0),
		resize : () : void => {
			page.height = window.innerHeight * 0.9;
			const width = Math.max(window.innerWidth * 0.4, 300) + 30;
			page.width[0] = (window.innerWidth - width) / 2;
			page.width[1] = width;
		},
		card : 0,
		deck : [[], [], []] as [CardPics, CardPics, CardPics],
		move : {
			x : 0,
			y : 0,
			on : (x : number, y : number) => {
				page.move.x = x;
				page.move.y = y;
			}
		},
		hover : undefined as undefined | Hover,
		oncard : (card : number) => page.card = card,
		to_deck : (name : string) => new Deck({
			main : page.deck[0].slice().sort((a, b) => a.index - b.index).map(i => i.code),
			extra : page.deck[1].slice().sort((a, b) => a.index - b.index).map(i => i.code),
			side : page.deck[2].slice().sort((a, b) => a.index - b.index).map(i => i.code),
			name : name
		}),
		save : async (name : string) => {
			const deck = page.to_deck(name);
			const write = await fs.write.ydk(name, deck);
			let rename = true;
			if (write && !props.this_deck.new && props.this_deck.name && name !== props.this_deck.name && (props.this_deck.name?.length ?? 0 > 0))
				rename = await fs.rename.ydk(props.this_deck.name, name);
			if (write && rename)
				toast.info(mainGame.get.text(I18N_KEYS.DECK_SAVE_COMPELETE));
			if (props.this_deck.new)
				emit('update', name);
		},
		sort : () => {
			const sort = (a : CardPic, b : CardPic) : number => {
				const card = {
					a : mainGame.get.card(a.code),
					b : mainGame.get.card(b.code)
				};
				return card.a.level === card.b.level ? card.a.id - card.b.id : card.b.level - card.a.level;
			};
			page.deck.forEach(deck => {
				deck.sort(sort);
				deck.forEach((i, v) => {
					if (i.index !== v)
						i.index = v;
				});
			});
		},
		copy : async (name : string) => emit('copy', page.to_deck(name)),
		disrupt : async () : Promise<void> => {
			const on = async () : Promise<void> => {
				const sort = () : number =>  Math.random() - 0.5;
				page.deck.forEach(deck => {
					deck.sort(sort);
					deck.forEach((i, v) => {
						if (i.index !== v)
							i.index = v;
					});
				});
			};
			await Dialog({
				title : mainGame.get.text(I18N_KEYS.DECK_DISRUPT).value,
				onConfirm : on
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_DISRUPT_DECK));
		},
		clear : async () => {
			const on = () => {
				page.deck[0].length = 0;
				page.deck[1].length = 0;
				page.deck[2].length = 0;
			};
			await Dialog({
				title : mainGame.get.text(I18N_KEYS.DECK_CLEAR).value,
				onConfirm : on
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_CLEAR_DECK));
		}
	});

	const props = defineProps<{
		this_deck : Deck;
	}>();

	onBeforeMount(async () : Promise<void> => {
		page.resize();
		window.addEventListener("resize", page.resize);
	});

	onUnmounted(() => {
		window.removeEventListener("resize", page.resize);
	});

	const emit = defineEmits<{
		update : [name : string];
		copy : [deck : Deck];
		exit : [];
	}>();

</script>
<style scoped lang = 'scss'>
	main {
		display: flex;
		align-self: center;
		justify-items: flex-start;
	}
</style>