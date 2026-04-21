<template>
	<Selecter
		@confirm = "emit('exit', cards.map(i => page.result.indexOf(i)))"
		@cancel = "emit('exit')"
		:cancelable = 'false'
		:confirmable = 'page.result.length === cards.length'
	>
		<template #title>
			{{ title }}
		</template>
		<template #body>
			<div class = 'group'>
				<div v-for = 'i in cards'>
					<div @click = 'page.select(i)'>
						<img :src = 'mainGame.get.card(i.id).pic'/>
						<span>{{ page.loc(i) }}</span>
					</div>
					<div>{{ page.index(i) }}</div>
				</div>
			</div>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import { LOCATION } from '@/pages/duel/ygo-protocol/network';
	import Client_Card from '@/pages/duel/scene/client_card';
	
	import Selecter from './selecter.vue';

	const props = defineProps<{
		cards : Array<Client_Card>;
		title : string;
	}>();

	const players = [I18N_KEYS.DUEL_PLAYER_SELF, I18N_KEYS.DUEL_PLAYER_OPPO];
	const locs = new Map([
		[LOCATION.HAND, I18N_KEYS.DUEL_LOCATION_HAND],
		[LOCATION.DECK, I18N_KEYS.DUEL_LOCATION_DECK],
		[LOCATION.EXTRA, I18N_KEYS.DUEL_LOCATION_EX_DECK],
		[LOCATION.GRAVE, I18N_KEYS.DUEL_LOCATION_GRAVE],
		[LOCATION.REMOVED, I18N_KEYS.DUEL_LOCATION_REMOVED],
		[LOCATION.OVERLAY, I18N_KEYS.DUEL_LOCATION_OVERLAY],
		[LOCATION.MZONE, I18N_KEYS.DUEL_LOCATION_MZONE],
		[LOCATION.SZONE, I18N_KEYS.DUEL_LOCATION_SZONE]
	]);

	const page = reactive({
		show : false,
		result : [] as Array<Client_Card>,
		select : (card : Client_Card) => {
			const i = page.result.indexOf(card);
			i > - 1 ? page.result.splice(i, 1) : page.result.push(card);
		},
		loc : (i : Client_Card) : string => {
			let str = `[${mainGame.get.text(players[i.owner])}]`;
			const loc = locs.get(i.location & LOCATION.OVERLAY ? LOCATION.OVERLAY : i.location);
			if (loc) {
				const index = i.location & LOCATION.DECK ? props.cards
					.filter(c => (c.location & LOCATION.DECK)
						&& i.owner === c.owner)
					.indexOf(i)
					: i.location & LOCATION.OVERLAY ? i.overlay : i.seq;
				str += `${mainGame.get.text(loc)}[${index}]`;
			}
			return str;
		},
		index : (i : Client_Card) : number | string => {
			const ct = page.result.indexOf(i)
			return ct > - 1 ? ct : '';
		}
	});

	const emit = defineEmits<{
		exit : [card ?: Array<number>];
		click : [card : Client_Card];
	}>();

</script>
<style scoped lang = 'scss'>
	.group {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		> :deep(div) {
			flex-shrink: 0;
			position: relative;
			height: calc(100% - 10px);
			width: 200px;
			> div:first-child {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				height: 100%;
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-direction: column;
				> img {
					height: calc(100% - 40px);
				}
			}
			> div:last-child {
				position: absolute;
				border: 1px solid #9ed3ff;
				background-color: rgba(0, 0, 0, 0.5);
				color: #9ed3ff;
				width: 32px;
				height: 32px;
				top: 20px;
				right: 20%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
	}
</style>