<template>
	<div
		:style = "{ '--h' : `${page.show ? 300 : 80}px`}"
		class = 'selecter'
	>
		<div>
			<var-switch v-model = 'page.show'/>
			{{ title }} [{{ min }} - {{ max }}]
		</div>
		<var-checkbox-group
			v-if = 'min > 1'
			:max = 'max'
			v-model = '(page.cards as Array<Client_Card>)'
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
		>
			<div v-for = 'i in cards'>
				<div @click = 'page.select(i)'>
					<img :src = 'mainGame.get.card(i.id).pic'/>
					<span>{{ page.loc(i) }}</span>
				</div>
				<var-radio :checked-value = 'i'/>
			</div>
		</var-radio-group>
		<div
			:style = "{
				flexDirection : mainGame.get.system(KEYS.SETTING_CHK_SWAP_BUTTON) ? 'initial' : 'row-reverse'
			}">
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.CONFIRM)'
					@click = "emit('exit', page.cards)"
				/>
			</div>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.CANCEL)'
					@click = "emit('exit', undefined)"
				/>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import Button from '@/pages/ui/button.vue';

	import { LOCATION } from '../ygo-protocol/network';
	import Client_Card from '../scene/client_card';
	import { KEYS } from '@/script/constant';

	const props = defineProps<{
		cards : Array<Client_Card>;
		title : string;
		min : number;
		max : number;
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
		}
	});

	const emit = defineEmits<{
		exit : [card : Array<Client_Card> | Client_Card | undefined];
	}>();

</script>
<style scoped lang = 'scss'>
	@use './selecter.scss';
</style>