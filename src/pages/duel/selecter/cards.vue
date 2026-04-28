<template>
	<Selecter
		@confirm = "emit('exit', Array.isArray(page.cards) ? page.cards.map(i => toRaw(i)) : toRaw(page.cards))"
		@cancel = "emit('exit')"
		:cancelable = 'cancelable'
		:confirmable = 'page.confirmable'
	>
		<template #title>
			{{ title }} [{{ min }} - {{ max }}]
		</template>
		<template #body>
			<var-checkbox-group
				v-if = 'Array.isArray(page.cards)'
				:max = 'max'
				v-model = '(page.cards as Array<Client_Card>)'
				class = 'group'
			>
				<div v-for = 'i in cards'>
					<div @click = 'page.select(i)'
						:class = "{ 'select' : selected.includes(i) }"
					>
						<img :src = 'mainGame.get.card(i.id).pic'/>
						<span>{{ page.loc(i) }}</span>
					</div>
					<var-checkbox :checked-value = 'i' :readonly = 'selected.includes(i) ?? false'/>
				</div>
			</var-checkbox-group>
			<var-radio-group
				v-else
				v-model = 'page.cards'
				class = 'group'
			>
				<div v-for = 'i in cards'>
					<div @click.stop = "page.select(i); emit('click', i);"
						:class = "{ 'select' : selected.includes(i) }"
					>
						<img :src = 'mainGame.get.card(i.id).pic'/>
						<span>{{ page.loc(i) }}</span>
					</div>
					<var-radio
						:checked-value = 'i'
						@click = 'page.select(i)'
						:readonly = 'true'
					/>
				</div>
			</var-radio-group>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { computed, onBeforeMount, reactive, toRaw } from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import { LOCATION } from '@/pages/duel/ygo-protocol/network';
	import Client_Card from '@/pages/duel/scene/client_card';
	import Selecter from './selecter.vue';

	const props = defineProps<{
		cards : Array<Client_Card>;
		title : string;
		min : number;
		max : number;
		cancelable : boolean;
		selected : Array<Client_Card>;
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

	onBeforeMount(() => {
		if (props.selected.length > 0)
			page.cards = props.selected.slice();
		else if (props.min > 1)
			page.cards = [];
	});

	const page = reactive({
		show : false,
		cards : undefined as Array<Client_Card> | Client_Card | undefined,
		select : (card : Client_Card) => {
			if (Array.isArray(page.cards)) {
				if (props.selected.includes(card))
					return;
				const cards = page.cards;
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
		confirmable : computed(() : boolean => {
			if (Array.isArray(page.cards)) {
				const cards = page.cards;
				return cards.length >= props.min;
			}
			return !!page.cards;
		})
	});

	const emit = defineEmits<{
		exit : [card ?: Array<Client_Card> | Client_Card];
		click : [card : Client_Card];
	}>();

</script>
<style scoped lang = 'scss'>
	.group {
		height: 100%;
		> :deep(div) {
			height: 100%;
			display: flex;
			flex-wrap: nowrap;
			> div {
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
				.select {
					img {
						border: 2px solid yellow;
					}
					span {
						color: yellow;
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