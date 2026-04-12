<template>
	<Selecter
		@confirm = "emit('exit', page.cards)"
		@cancel = "emit('exit')"
		:cancelable = 'cancelable'
		:confirmable = '!!page.cards'
	>
		<template #title>
			{{ title }} [{{ min }} - {{ max }}]
		</template>
		<template #body>
			<var-radio-group
				v-model = 'page.cards'
				class = 'group'
			>
				<TransitionGroup tag = 'div' name = 'scale'>
					<div v-for = 'i in select' :key = '`${i.location}${i.seq}${i.owner}`'>
						<div @click.stop = "page.select(i); emit('click', i);">
							<img :src = 'mainGame.get.card(i.id).pic' class = 'select'/>
							<span class = 'select'>{{ page.loc(i) }}</span>
						</div>
						<var-radio :checked-value = 'i' @click = 'page.select(i)' :readonly = 'true'/>
					</div>
					<div v-for = 'i in unselect' :key = '`${i.location}${i.seq}${i.owner}`'>
						<div @click.stop = "page.select(i); emit('click', i);">
							<img :src = 'mainGame.get.card(i.id).pic'/>
							<span>{{ page.loc(i) }}</span>
						</div>
						<var-radio :checked-value = 'i' @click = 'page.select(i)' :readonly = 'true'/>
					</div>
				</TransitionGroup>
			</var-radio-group>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import { LOCATION } from '../ygo-protocol/network';
	import Client_Card from '../scene/client_card';
	import Selecter from './selecter.vue';

	const props = defineProps<{
		select : Array<Client_Card>;
		unselect : Array<Client_Card>;
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
		[LOCATION.MZONE, I18N_KEYS.DUEL_LOCATION_MZONE],
		[LOCATION.SZONE, I18N_KEYS.DUEL_LOCATION_SZONE]
	]);

	const page = reactive({
		show : false,
		cards : undefined as Client_Card | undefined,
		select : (card : Client_Card) => page.cards = page.cards === card ? undefined : card,
		loc : (i : Client_Card) : string => {
			let str = `[${mainGame.get.text(players[i.owner])}]`;
			const loc = locs.get(i.location);
			if (loc) {
				const index = i.location & LOCATION.DECK ? props.select
					.concat(props.unselect)
					.filter(c => (c.location & LOCATION.DECK)
						&& i.owner === c.owner)
					.indexOf(i)
					: i.location & LOCATION.OVERLAY ? i.overlay : i.seq;
				str += `${mainGame.get.text(loc)}[${index}]`;
			}
			return str;
		}
	});

	const emit = defineEmits<{
		exit : [card ?: Client_Card];
		click : [card : Client_Card];
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
				height: 100%;
				display: flex;
				flex-wrap: nowrap;
				overflow-x: auto;
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
						img.select {
							border: 2px solid yellow;
						}
						span.select {
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
	}
</style>