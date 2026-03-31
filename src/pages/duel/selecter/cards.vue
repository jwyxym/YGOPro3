<template>
	<Selecter
		@confirm = "emit('exit', page.cards)"
		@cancel = "emit('exit')"
		:cancelable = 'cancelable'
		:confirmable = 'page.confirmable'
	>
		<template #title>
			{{ title }} [{{ min }} - {{ max }}]
		</template>
		<template #body>
			<var-checkbox-group
				v-if = 'min > 1'
				:max = 'max'
				v-model = '(page.cards as Array<Client_Card>)'
				class = 'group'
			>
				<div v-for = 'i in cards'>
					<div @click = 'page.select(i)'>
						<img :src = 'mainGame.get.card(i.id).pic'/>
						<span>{{ page.loc(i) }}</span>
					</div>
					<var-checkbox :checked-value = 'i'></var-checkbox>
				</div>
			</var-checkbox-group>
			<var-radio-group
				v-else
				v-model = 'page.cards'
				class = 'group'
			>
				<div v-for = 'i in cards'>
					<div @click = 'page.select(i)'>
						<img :src = 'mainGame.get.card(i.id).pic'/>
						<span>{{ page.loc(i) }}</span>
					</div>
					<var-radio :checked-value = 'i' @click = 'page.select(i)' :readonly = 'true'/>
				</div>
			</var-radio-group>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { computed, reactive } from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import { LOCATION } from '../ygo-protocol/network';
	import Client_Card from '../scene/client_card';
	import Selecter from './selecter.vue';

	const props = defineProps<{
		cards : Array<Client_Card>;
		title : string;
		min : number;
		max : number;
		cancelable : boolean;
	}>();

	const players = [I18N_KEYS.DUEL_PLAYER_SELF, I18N_KEYS.DUEL_PLAYER_OPPO];
	const locs = new Map([
		[LOCATION.HAND, I18N_KEYS.DUEL_LOCATION_HAND],
		[LOCATION.DECK, I18N_KEYS.DUEL_LOCATION_DECK],
		[LOCATION.EXTRA, I18N_KEYS.DUEL_LOCATION_EX_DECK],
		[LOCATION.GRAVE, I18N_KEYS.DUEL_LOCATION_GRAVE],
		[LOCATION.REMOVED, I18N_KEYS.DUEL_LOCATION_REMOVED],
		[LOCATION.OVERLAY, I18N_KEYS.DUEL_LOCATION_OVERLAY],
	]);

	const page = reactive({
		show : false,
		cards : props.min > 1 ? [] : undefined as Array<Client_Card> | Client_Card | undefined,
		select : (card : Client_Card) => {
			if (props.min > 1) {
				const cards = page.cards as Array<Client_Card>;
				const ct = cards.indexOf(card);
				if (ct > -1)
					cards.splice(ct, 1);
				else if (cards.length < props.max)
					cards.push(card);
			} else
				page.cards = page.cards === card ? undefined : card;
		},
		loc : (i : Client_Card) : string => {
			let str = `[${mainGame.get.text(players[i.owner])}]`;
			const loc = locs.get(i.location);
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
		confirmable : computed(() : boolean => {
			if (props.min > 1) {
				const cards = page.cards as Array<Client_Card>;
				return cards.length >= props.min;
			}
			return !!page.cards;
		})
	});

	const emit = defineEmits<{
		exit : [card ?: Array<Client_Card> | Client_Card];
	}>();

</script>
<style scoped lang = 'scss'>
	.group {
		height: 100%;
		width: 100%;
		> :deep(div) {
			height: 100%;
			width: 100%;
			> div {
				position: relative;
				height: 100%;
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
					flex-direction: column;
					> img {
						height: calc(100% - 30px);
					}
				}
				.var-radio {
					position: absolute;
					top: 0;
					right: 0;
				}
			}
		}
	}
</style>