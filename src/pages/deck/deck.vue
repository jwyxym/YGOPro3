<template>
	<main class = 'deck'>
		<Card_Info
			:height = 'page.height'
			:width = 'page.width[0]'
			:desc = 'page.desc'
			v-model = 'page.card'
			@about = 'page.about'
		/>
		<div>
			<Deck_Setting
				v-model = 'page.deck_name'
				:height = '70'
				:width = 'page.width[1]'
				:deck = 'this_deck'
				@save = 'page.save'
				@sort = 'page.sort'
				@share = 'page.copy'
				@disrupt = 'page.disrupt'
				@clear = 'page.clear'
			/>
			<Drag_Box
				v-if = 'page.ct'
				:ref = '(el) => (page.el = el as InstanceType<typeof Drag_Box> | null)'
				:height = 'page.height - 70'
				:width = 'page.width[1]'
				:count = 'page.ct'
				:deck = 'this_deck'
				:lflist = 'page.lflist'
				:del = 'true'
				@card = 'page.oncard'
			/>
		</div>
		<Card_List
			:ref = '(el) => (page.card_list = el as InstanceType<typeof Card_List> | null)'
			:height = 'page.height'
			:width = 'page.width[0]'
			:lflist = 'page.lflist'
			:info = 'search.info'
			:switchs = 'search.switchs'
			@save = 'page.save'
			@card = 'page.oncard'
			@exit = "emit('exit')"
			@add = 'page.el?.add($event)'
			@dragstart = 'page.el?.dragstart($event)'
			@dragend = 'page.el?.dragend($event)'
			@search = 'page.search = true'

			v-model:desc = 'page.desc'
		/>
		<transition name = 'opacity'>
			<Searcher
				v-if = 'page.search'
				v-model:ot = 'search.info.ot'
				v-model:type = 'search.info.type'
				v-model:attribute = 'search.info.attribute'
				v-model:race = 'search.info.race'
				v-model:category = 'search.info.category'
				v-model:link = 'search.info.link'
				v-model:lflist = 'search.info.lflist'
				v-model:forbidden = 'search.info.forbidden'
				v-model:lv = 'search.info.lv'
				v-model:atk = 'search.info.atk'
				v-model:def = 'search.info.def'
				v-model:scale = 'search.info.scale'
				v-model:desc = 'search.info.desc'
				v-model:type-switch = 'search.switchs.type'
				v-model:category-switch = 'search.switchs.category'
				v-model:link-switch = 'search.switchs.link'
				@search = 'page.card_list?.search'
				@clear = 'search.clear()'
				@close = 'page.search = false'
			/>
		</transition>
	</main>
</template>
<script setup lang = 'ts'>
	import { computed, reactive } from 'vue';

	import mainGame from '@/script/game';
	import invoke from '@/script/invoke';
	import * as CONSTANT from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import GLOBAL from '@/script/scale';

	import dialog from '@/ui/dialog';
	import { toast } from '@/pages/toast/toast';

	import Deck from './deck';
	import Searcher from './searcher.vue';
	import Deck_Setting from './setting.vue';
	import Card_List from './card_list.vue';
	import Drag_Box from './drag.vue';
	import Card_Info from './card_info.vue';

	const props = defineProps<{
		this_deck : Deck;
	}>();

	const search = reactive({
		info : {
			ot : [] as Array<number>,
			type : [[], [], [], []] as [Array<number>, Array<number>, Array<number>, Array<number>],
			attribute : [] as Array<number>,
			race : [] as Array<number>,
			category : [] as Array<number>,
			link : [] as Array<number>,
			lflist : mainGame.lflist.keys().next().value ?? CONSTANT.KEYS.NA,
			forbidden : '',
			lv : '',
			atk : '',
			def : '',
			scale : '',
			desc : ''
		},
		switchs : {
			'type' : false,
			'category' : false,
			'link' : false,
		},
		clear : function () {
			this.info.ot.length = 0;
			this.info.race.length = 0;
			this.info.attribute.length = 0;
			this.info.category.length = 0;
			this.info.link.length = 0;
			this.info.type.forEach(i => i.length = 0);
			this.info.lflist = '';
			this.info.forbidden = '';
			this.info.lv = '';
			this.info.atk = '';
			this.info.def = '';
			this.info.scale = '';
			this.info.desc = '';
		}
	});

	const page = reactive({
		el : null as null | InstanceType<typeof Drag_Box>,
		card_list : null as null | InstanceType<typeof Card_List>,
		lflist : computed(() => mainGame.lflist.get(search.info.lflist)),
		height : GLOBAL.HEIGHT * 0.9,
		width : [GLOBAL.WIDTH * 0.3 - 20, GLOBAL.WIDTH * 0.9 / 3 + 40],
		card : 0 as number | string,
		ct : mainGame.get.system(CONSTANT.KEYS.SETTING_CT_DECK_PRELINE) as number,
		deck_name : props.this_deck.name ?? '',
		desc : [],
		search : false,
		about : (card : number) => page.card_list?.about(card),
		oncard : (card : number | string) => page.card = card,
		to_deck : (name : string) : Deck => page.el?.to_deck(name) ?? new Deck(),
		save : async () => {
			const name = page.deck_name;
			const rule = await page.name_rule(name);
			const save = async () => {
				const deck = page.to_deck(name);
				const write = await invoke.deck.write(name, deck.toYdkString());
				let rename = true;
				if (write && !props.this_deck.new && props.this_deck.name && name !== props.this_deck.name && (props.this_deck.name?.length ?? 0 > 0))
					rename = await invoke.deck.rename(props.this_deck.name, name);
				if (write && rename)
					toast.info(mainGame.get.text(I18N_KEYS.DECK_SAVE_COMPELETE));
				if (props.this_deck.new)
					emit('update', name);
			};
			typeof rule == 'boolean'
				? save()
				: toast.error(rule);
		},
		sort : () => page.el?.sort(),
		copy : async () => {
			const rule = await page.name_rule(page.deck_name);
			typeof rule == 'boolean'
				? emit('copy', page.to_deck(page.deck_name))
				: toast.error(rule);
		},
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
		},
		name_rule : async (name ?: string) : Promise<string | boolean> => {
			if (name === undefined || name.length === 0)
				return mainGame.get.text(I18N_KEYS.RULE_NAME_LEN);
			if (name.match(CONSTANT.REG.NAME))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
			if ((await invoke.deck.get()).filter(i => i.name === name).length > (props.this_deck.new || (props.this_deck.name!.length > 0 && props.this_deck.name !== name) ? 0 : 1))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_EXIST);
			return true;
		}
	});

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
		.ygopro3__deck__search {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
		}
	}

	.opacity {
		&-enter-active,
		&-leave-active {
			transition: opacity 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			opacity: 0;
		}

		&-enter-to,
		&-leave-from {
			opacity: 1;
		}
	}
</style>