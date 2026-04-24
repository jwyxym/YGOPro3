<template>
	<main>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Server
				v-if = '!connect.state'
				@connect = 'connect.on'
				key = '0'
			/>
			<Wait
				v-if = 'connect.state === 1'
				:player = 'connect.wait.players'
				:self = 'connect.wait.self'
				:info = 'connect.wait.info'
				@kick = 'connect.wait.kick'
				@deck = 'connect.wait.deck.send'
				@chk = 'connect.wait.deck.chk'
				@duelist = 'connect.wait.duelist'
				@watcher = 'connect.wait.watcher'
				@connect = 'connect.on'
				@disconnect = 'connect.close'
				key = '1'
			/>
			<Scene
				v-if = 'connect.state === 2'
				key = '2'
			/>
			<Card_info
				v-model = 'connect.duel.card'
				:width = 'card_info.width'
				:height = 'card_info.height'
				v-if = 'connect.state > 1 && connect.duel.card'
				key = '3'
			/>
			<RPS
				v-if = 'connect.state === 2 && connect.duel.rps.show'
				@click = 'async (v : number) => {
					connect.duel.rps.show = false;
					await connect.duel.rps.send(v);
				}'
				key = '4'
			/>
			<Phase
				v-if = 'connect.state === 2'
				key = '5'
			/>
			<Avatar
				class = 'avatar__first'
				v-if = 'connect.duel.player[0].index > - 1'
				:time = 'connect.duel.player[0].time'
				:lp = 'connect.duel.player[0].lp'
				:name = 'connect.duel.player[0].name'
				:desc = 'Array.from(connect.duel.player[0].desc.keys())'
				:style = "{ '--top' : `${card_info.height}px` }"
				:time_player = 'connect.duel.time_player'
				:index = '0'
				key = '6'
			/>
			<Avatar
				class = 'avatar__last'
				v-if = 'connect.duel.player[1].index > - 1'
				:time = 'connect.duel.player[1].time'
				:lp = 'connect.duel.player[1].lp'
				:name = 'connect.duel.player[1].name'
				:desc = 'Array.from(connect.duel.player[1].desc.keys())'
				:time_player = 'connect.duel.time_player'
				:index = '1'
				key = '7'
			/>
			<Side
				:ref = '(el) => (side.el = el as InstanceType<typeof Side> | null)'
				v-if = 'connect.state >= 3 && side.show'
				:height = 'side.height'
				:width = 'side.width'
				:count = 'side.count'
				:deck = 'connect.wait.deck.current!'
				:del = 'false'
				@card = '(card : number) => connect.duel.card = card'
			/>
		</TransitionGroup>
		<div>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
				@click = 'exit'
				key = '0'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_AI)'
				@click = "async () => await connect.send?.(new Msg()
					.write.uint8(CTOS.CHAT)
					.write.str('/ai'))"
				v-show = 'connect.state === 1'
				key = '1'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_SURRENDER)'
				@click = "async () => dialog({
							title : mainGame.get.text(I18N_KEYS.DUEL_SURRENDER_TITLE)
						}, mainGame.get.system(KEYS.SETTING_CHK_SURRENDER)
					).then(async i => i ? await connect.send?.(new Msg().write.uint8(CTOS.SURRENDER))
						: undefined)
				"
				v-show = 'connect.state === 2'
				key = '2'
			/>
			<Button
				:content = 'mainGame.get.text(connect.state === 3 ? I18N_KEYS.CONFIRM : I18N_KEYS.DUEL_DECK_CONFIRM)'
				@click = 'update_side'
				v-show = 'connect.state >= 3'
				key = '3'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_DECK_RESTORE)'
				@click = 'async () => {
					side.show = false;
					await mainGame.sleep(100);
					side.show = true;
				}'
				v-show = 'connect.state === 3'
				key = '4'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_HISTORY)'
				@click = 'connect.chat.on'
				v-show = 'connect.state'
				key = '5'
			/>
		</div>
		<TransitionGroup tag = 'div' name = 'bottom_in'>
			<Select_Cards
				v-if = 'connect.duel.select.cards.show'
				:cards = 'connect.duel.select.cards.cards'
				:min = 'connect.duel.select.cards.min'
				:max = 'connect.duel.select.cards.max'
				:title = 'connect.duel.select.cards.title'
				:cancelable = 'connect.duel.select.cards.cancelable'
				:selected = 'connect.duel.select.cards.selected'
				@exit = '(i ?: Client_Card | Array<Client_Card>) => connect.duel.select.cards.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '0'
			/>
			<Select_Group
				v-if = 'connect.duel.select.group.show'
				:select = 'connect.duel.select.group.select'
				:unselect = 'connect.duel.select.group.unselect'
				:min = 'connect.duel.select.group.min'
				:max = 'connect.duel.select.group.max'
				:title = 'connect.duel.select.group.title'
				:cancelable = 'connect.duel.select.group.cancelable'
				@exit = '(i ?: Client_Card) => connect.duel.select.group.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '1'
			/>
			<Select_Codes
				v-if = 'connect.duel.select.code.show'
				:cards = 'connect.duel.select.code.codes'
				:title = 'connect.duel.select.code.title'
				@exit = '(i ?: number) => connect.duel.select.code.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '2'
			/>
			<Select_Number
				v-if = 'connect.duel.select.number.show'
				:number = 'connect.duel.select.number.array'
				:title = 'connect.duel.select.number.title'
				@exit = '(i ?: number) => connect.duel.select.number.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '3'
			/>
			<Select_Option
				v-if = 'connect.duel.select.option.show'
				:options = 'connect.duel.select.option.array'
				:title = 'connect.duel.select.option.title'
				:cancelable = 'connect.duel.select.option.cancelable'
				@exit = '(i ?: number) => connect.duel.select.option.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '4'
			/>
			<Select_Race
				v-if = 'connect.duel.select.race.show'
				:available = 'connect.duel.select.race.available'
				:title = 'connect.duel.select.race.title'
				:ct = 'connect.duel.select.race.count'
				@exit = '(i ?: number | Array<number>) => connect.duel.select.race.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '5'
			/>
			<Select_Attribute
				v-if = 'connect.duel.select.attribute.show'
				:available = 'connect.duel.select.attribute.available'
				:title = 'connect.duel.select.attribute.title'
				:ct = 'connect.duel.select.attribute.count'
				@exit = '(i ?: number | Array<number>) => connect.duel.select.attribute.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '6'
			/>
			<Select_Pos
				v-if = 'connect.duel.select.pos.show'
				:pos = 'connect.duel.select.pos.pos'
				:title = 'connect.duel.select.pos.title'
				:id = 'connect.duel.select.pos.id'
				@exit = '(i ?: number | Array<number>) => connect.duel.select.pos.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '7'
			/>
			<Select_Counter
				v-if = 'connect.duel.select.counter.show'
				:cards = 'connect.duel.select.counter.cards'
				:counter = 'connect.duel.select.counter.counter'
				:title = 'connect.duel.select.counter.title'
				:count = 'connect.duel.select.counter.count'
				:counts = 'connect.duel.select.counter.counts'
				@exit = '(i ?: number | Array<number>) => connect.duel.select.counter.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '8'
			/>
			<Select_Sort
				v-if = 'connect.duel.select.sort.show'
				:cards = 'connect.duel.select.sort.cards'
				:title = 'connect.duel.select.sort.title'
				@exit = '(i ?: number | Array<number>) => connect.duel.select.sort.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '9'
			/>
			<Select_Plaid
				v-if = 'connect.duel.select.plaid.show'
				:plaids = 'connect.duel.select.plaid.plaids'
				:cards = 'connect.duel.select.plaid.cards'
				:title = 'connect.duel.select.plaid.title'
				:min = 'connect.duel.select.plaid.min'
				:cancelable = 'connect.duel.select.plaid.cancelable'
				@exit = '(i ?: Plaid) => connect.duel.select.plaid.confirm?.(i)
					?? connect.response?.(i)'
				@click = 'duel.click'
				key = '10'
			/>
		</TransitionGroup>
		<TransitionGroup tag = 'div' name = 'right_in'>
			<Chain
				v-if = 'connect.duel.chain.length && !connect.duel.cards.length'
				:cards = 'connect.duel.chain'
				@click = 'duel.click'
				key = '0'
			/>
			<Cards
				v-if = 'connect.duel.cards.length'
				:cards = 'connect.duel.cards'
				@click = 'duel.click'
				key = '1'
			/>
			<Log
				v-if = 'connect.chat.show'
				@exit = 'connect.chat.off'
				key = '2'
			/>
		</TransitionGroup>
	</main>
</template>
<script setup lang = 'ts'>
	import { onUnmounted, reactive, watch } from 'vue';

	import Button from '@/pages/ui/button.vue';
	import dialog, { close } from '@/pages/ui/dialog';
	import Card_info from '@/pages/deck/card_info.vue';
	import Side from '@/pages/deck/cards.vue';
	import Deck from '@/pages/deck/deck';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import GLOBAL from '@/script/scale';
	import { KEYS } from '@/script/constant';

	import Server from './server.vue';
	import Wait from './wait.vue';
	import connect from './connect';
	import RPS from './rps.vue';
	import Avatar from './avatar.vue';

	import Log from './log/log.vue';

	import Scene, { duel } from './scene/scene';
	import Phase from './scene/phase';
	import Chain from './scene/chain.vue';
	import Cards from './scene/cards.vue';
	import Client_Card from './scene/client_card';
	import Plaid from './scene/plaid';

	import Select_Cards from './selecter/cards.vue';
	import Select_Group from './selecter/group.vue';
	import Select_Codes from './selecter/code.vue';
	import Select_Number from './selecter/number.vue';
	import Select_Option from './selecter/option.vue';
	import Select_Race from './selecter/race.vue';
	import Select_Attribute from './selecter/attribute.vue';
	import Select_Plaid from './selecter/plaid.vue';
	import Select_Pos from './selecter/pos.vue';
	import Select_Counter from './selecter/counter.vue';
	import Select_Sort from './selecter/sort.vue';

	import { CTOS } from './ygo-protocol/network';
	import Msg from './ygo-protocol/msg';

	const card_info = {
		width : 360,
		height : GLOBAL.HEIGHT * 0.8
	};
	
	const side = reactive({
		show : true,
		count : 15,
		width : (GLOBAL.WIDTH - 360) * 0.9 / 1.6 + 40,
		height : GLOBAL.HEIGHT * 0.9,
		el : null as InstanceType<typeof Side> | null
	});

	onUnmounted(connect.clear);

	const exit = async () => connect.state ? (async () => {
		if (await dialog({
			title : mainGame.get.text(I18N_KEYS.DECK_EXIT),
		}, mainGame.get.system(KEYS.SETTING_CHK_EXIT_SERVER)))
			connect.close()
	})() : emit('exit');

	const update_side = async () : Promise<void> => {
		if (connect.state === 3) {
			const deck = side.el?.to_deck('') ?? new Deck();
			await connect.on(deck);
		}
	};

	const emit = defineEmits<{
		exit : []
	}>();

	watch(() => connect.duel.select.confirm.show, (n : boolean) => {
		if (n)
			dialog({
				title : connect.duel.select.confirm.title,
				message : connect.duel.select.confirm.message,
				closeOnClickOverlay : false
			}, connect.duel.select.confirm.chk)
				.then(async (i : boolean) => await (
					connect.duel.select.confirm.confirm?.(i)
						?? connect.response?.(i)
				))
		else close();
	});
</script>
<style scoped lang = 'scss'>
	main {
		position: relative;
		height: calc(var(--height) * 0.9);
		width: calc(var(--width) * 0.9);
		> div:first-child {
			height: 100%;
			width: 100%;
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			> div {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
			}
			> main {
				position: fixed;
				left: 50%;
				transform: translateX(-50%);
			}
			.info {
				position: fixed;
				left: 0;
				top: 0;
				transform: translateX(calc(-70px - var(--left) / var(--scale)));
				background-color: transparent !important;
				border: 1px solid white;
			}
			.rps {
				position: fixed;
				top: 100%;
				transform: translate(-50%, calc(var(--top) / var(--scale) - 100px));
			}
			.avatar {
				position: fixed;
				top: 0;
			}
			.avatar__first {
				left: 0;
				transform: translate(calc(-50px - var(--left) / var(--scale)), calc(var(--top) + 20px));
			}
			.avatar__last {
				right: 0;
				transform: translate(calc(var(--left) / var(--scale) + 500px), 0);
			}
		}
		> div:nth-child(2) {
			position: absolute;
			right: 0;
			bottom: 0;
			display: flex;
			flex-direction: column-reverse;
			gap: 5px;
			.var-button {
				width: 90px !important;
			}
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
	.bottom_in {
		&-enter-active,
		&-leave-active {
			transition: transform 0.1s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translateY(calc(100% / var(--scale)));
		}

		&-enter-to,
		&-leave-from {
			transform: translateY(calc(var(--top) / var(--scale)));
		}
	}
	.right_in {
		&-enter-active,
		&-leave-active {
			transition: transform 0.1s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translate(calc(100% / var(--scale)), -50%);
		}

		&-enter-to,
		&-leave-from {
			transform: translate(calc(var(--left) / var(--scale) - 10px), -50%);
		}
	}
</style>