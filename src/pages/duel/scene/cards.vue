<template>
	<div class = 'cards no-scrollbar'>
		<div
			v-for = '(i, v) in cards'
			:key = 'v'
			:id = 'i.id.toString()'
			@click.stop = "emit('click', i);"
		>
			<img :src = 'mainGame.get.card(i.id).pic'/>
			{{ loc(i) }}
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { LOCATION } from '@/pages/duel/ygo-protocol/network';
	import Client_Card from './client_card';

	const props  = defineProps<{
		cards : Array<Client_Card>
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
	const loc = (i : Client_Card) : string => {
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
	};

	const emit = defineEmits<{
		click : [card : Client_Card];
	}>();
</script>
<style scoped lang = 'scss'>
	.cards {
		border: 1px white solid;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		position: fixed;
		right: 0;
		top: 50%;
		width: 150px;
		height: calc(var(--height) * 0.9);
		transform: translate(calc(var(--left) / var(--scale) - 10px), -50%);
		overflow-y: auto;
		scroll-behavior: smooth;
		> div {
			width: 100%;
			height: 130px;
			background: linear-gradient(to right, var(--color), transparent);
			display: flex;
			flex-direction: column;
			> img {
				align-self: center;
				width: 70px;
			}
		}
	}
</style>