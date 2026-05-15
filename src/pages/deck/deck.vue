<template>
	<main class = 'deck'>
		<Card_Box
			:height = 'page.height'
			:width = 'page.width[0]'
			v-model = 'page.card'
		/>
		<div>
			<Deck_Setting
				:height = '70'
				:width = 'page.width[1]'
				:deck = 'this_deck'
				@save = 'page.save'
				@sort = 'page.sort'
				@share = 'page.copy'
				@disrupt = 'page.disrupt'
				@clear = 'page.clear'
			/>
			<Deck_Box
				v-if = 'page.ct'
				:ref = '(el) => (page.el = el as InstanceType<typeof Deck_Box> | null)'
				:height = 'page.height - 70'
				:width = 'page.width[1]'
				:count = 'page.ct'
				:deck = 'this_deck'
				:lflist = 'page.lflist'
				:del = 'true'
				@card = 'page.oncard'
				@move = 'page.move.on'
			/>
		</div>
		<Search_Box
			:height = 'page.height'
			:width = 'page.width[0]'
			:count = '10'
			:move = 'page.move'
			:deck = 'this_deck'
			@card = 'page.oncard'
			@lflist = '(lflist ?: LFList) => page.lflist = lflist'
			@exit = "emit('exit')"
			@hover = '(i : [HTMLElement, number]) => page.el?.hover(i[0], i[1])'
			@add = '(i : number) => page.el?.add(i)'
		/>
	</main>
</template>
<script setup lang = 'ts'>
	import { reactive, watch } from 'vue';

	import mainGame from '@/script/game';
	import * as CONSTANT from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import LFList from '@/script/lflist';
	import GLOBAL from '@/script/scale';

	import dialog from '@/pages/ui/dialog';
	import { toast } from '@/pages/toast/toast';

	import Deck from './deck';
	import Search_Box from './searcher.vue';
	import Deck_Setting from './setting.vue';
	import Deck_Box from './cards.vue';
	import Card_Box from './card_info.vue';

	const page = reactive({
		el : null as null | InstanceType<typeof Deck_Box>,
		lflist : undefined as LFList | undefined,
		height : GLOBAL.HEIGHT * 0.9,
		width : [GLOBAL.WIDTH * 0.3 - 20, GLOBAL.WIDTH * 0.9 / 3 + 40],
		card : 0,
		ct : 0,
		move : {
			x : 0,
			y : 0,
			on : (x : number, y : number) => {
				page.move.x = x;
				page.move.y = y;
			}
		},
		oncard : (card : number) => page.card = card,
		to_deck : (name : string) : Deck => {
			return page.el?.to_deck(name) ?? new Deck();
		},
		save : async (name : string) => {
			const deck = page.to_deck(name);
			const write = await mainGame.deck.write(name, deck.toYdkString());
			let rename = true;
			if (write && !props.this_deck.new && props.this_deck.name && name !== props.this_deck.name && (props.this_deck.name?.length ?? 0 > 0))
				rename = await mainGame.deck.rename(props.this_deck.name, name);
			if (write && rename)
				toast.info(mainGame.get.text(I18N_KEYS.DECK_SAVE_COMPELETE));
			if (props.this_deck.new)
				emit('update', name);
		},
		sort : () => {
			page.el?.sort();
		},
		copy : async (name : string) => emit('copy', page.to_deck(name)),
		disrupt : async () : Promise<void> => {
			if (await dialog({
				title : mainGame.get.text(I18N_KEYS.DECK_DISRUPT),
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_DISRUPT_DECK)))
				page.el?.disrupt();
		},
		clear : async () => {
			if (await dialog({
				title : mainGame.get.text(I18N_KEYS.DECK_CLEAR),
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_CLEAR_DECK)))
				page.el?.clear();
		}
	});

	watch(() => GLOBAL.SCALE, (n) => page.ct = n < 0.6 ? 6 : 10, { immediate : true });

	const props = defineProps<{
		this_deck : Deck;
	}>();

	const emit = defineEmits<{
		update : [name : string];
		copy : [deck : Deck];
		exit : [];
	}>();

</script>
<style scoped lang = 'scss'>
	main {
		height: 100%;
		display: flex;
		align-self: center;
		justify-items: flex-start;
		gap: 5px;
		> div:nth-child(2) {
			height: 100%;
			display: flex;
			flex-direction: column;
		}
	}
</style>