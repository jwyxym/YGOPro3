<template>
	<div class = 'select_list' ref = 'dom' :class = "{ 'unshow' : !page.show }">
		<div class = 'title'>
			<var-switch v-model = 'page.show'/>
			{{ page.title }} [{{ page.min }} - {{ page.max }}]
		</div>
		<var-checkbox-group v-model = 'page.selects' :max = 'page.max'>
			<TransitionGroup class = 'list'  tag = 'div' name = 'scale'>
				<div v-for = 'i in page.list' class = 'pics'>
					<div class = 'pic' @click = 'page.select(i)'>
						<img :src = 'mainGame.get.card(i.code).pic'/>
						<span>{{ page.loc(i) }}</span>
					</div>
					<var-checkbox :checked-value = 'i' @change = 'page.select(i, false)'></var-checkbox>
				</div>
			</TransitionGroup>
		</var-checkbox-group>
		<Button_List :confirm = 'page.confirm' :cancel = 'page.cancel' class = 'button_list'/>
	</div>
</template>
<script setup lang = 'ts'>
	import { ref, reactive, TransitionGroup, onBeforeMount } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	
	import { Select_Cards, Select_Card } from '@/pages/server/post/tcp';
	import { LOCATION } from '@/pages/server/post/network';

	import Button_List from '@/pages/ui/button_list.vue';

	const page = reactive({
		list : [] as Select_Cards,
		title : '',
		min : 0,
		max : 0,
		selects : [] as Select_Cards,
		show : true,
		loc : (i : Select_Card) : string => {
			const players = [I18N_KEYS.DUEL_PLAYER_SELF, I18N_KEYS.DUEL_PLAYER_OPPO];
			const locs = new Map([
				[LOCATION.HAND, I18N_KEYS.DUEL_LOCATION_HAND],
				[LOCATION.DECK, I18N_KEYS.DUEL_LOCATION_DECK],
				[LOCATION.EXTRA, I18N_KEYS.DUEL_LOCATION_EX_DECK],
				[LOCATION.GRAVE, I18N_KEYS.DUEL_LOCATION_GRAVE],
				[LOCATION.REMOVED, I18N_KEYS.DUEL_LOCATION_REMOVED],
				[LOCATION.OVERLAY, I18N_KEYS.DUEL_LOCATION_OVERLAY],
			]);
			return `[${mainGame.get.text(players[i.tp])}]${(() => {
				const [key, seq] = locs.has(i.loc) ? [locs.get(i.loc)!, (i.loc & LOCATION.OVERLAY) === LOCATION.OVERLAY ? i.ct : i.seq]!
					: (i.loc & LOCATION.MZONE) === LOCATION.MZONE ?
						i.seq > 4 ? [I18N_KEYS.DUEL_LOCATION_EX_MZONE, i.seq - 5] : [I18N_KEYS.DUEL_LOCATION_MZONE, i.seq]
						: i.seq > 4 ? [I18N_KEYS.DUEL_LOCATION_FIELD, 0] : [I18N_KEYS.DUEL_LOCATION_SZONE, i.seq];
				return `${mainGame.get.text(key)}[${seq}]`;
			})()}`;
		},
		confirm : () => {
			if (page.selects.length < page.min)
				props.cancel(false, page.selects);
			props.confirm([page.selects.length].concat(page.selects.map(i => (props.cards as Select_Cards).indexOf(i))));
		},
		cancel : () => {
			page.selects.forEach(i => i.card?.select.off());
			props.cancel(page.selects);
		},
		select : (i : Select_Card, chk : boolean = true) => {
			const ct = page.selects.indexOf(i);
			if (ct > -1) {
				if (chk)
					page.selects.splice(ct, 1);
				i.card?.select.off();
			}
			else if (page.selects.length < page.max) {
				if (chk)
					page.selects.push(i);
				i.card?.select.on();
			}
		}
	});

	const dom = ref<HTMLElement | null>(null);

	onBeforeMount(() => {
		page.list = (props.cards as Select_Cards).sort((a, b) : number => {
			if (a.tp !== b.tp) return a.tp - b.tp;
			if (a.loc !== b.loc) return a.loc - b.loc;
			if (a.loc === LOCATION.OVERLAY) return a.ct - b.ct;
			return a.seq - b.seq;
		});
		page.title = props.title;
		page.min = props.min;
		page.max = props.max;
	});

	const props = defineProps(['cards', 'title', 'min', 'max', 'confirm', 'cancel']);
	defineExpose({ dom });
</script>
<style scoped lang = 'scss'>
	
</style>