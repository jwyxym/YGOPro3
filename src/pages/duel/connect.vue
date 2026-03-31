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
				:code = 'connect.card'
				:width = 'card_info.width'
				:height = 'card_info.height'
				v-if = 'connect.state === 2'
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
				v-show = 'connect.state == 1'
				key = '1'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_SURRENDER)'
				@click = "async () => Dialog({
							title : mainGame.get.text(I18N_KEYS.DUEL_SURRENDER_TITLE)
						}, mainGame.get.system(KEYS.SETTING_CHK_SURRENDER)
					).then(async i => i ? await connect.send?.(new Msg().write.uint8(CTOS.SURRENDER))
						: undefined)
				"
				v-show = 'connect.state == 2'
				key = '2'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_HISTORY)'
				@click = 'connect.chat.on'
				v-show = 'connect.state'
				key = '3'
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
				key = '1'
			/>
			<Select_Codes
				v-if = 'connect.duel.select.code.show'
				:cards = 'connect.duel.select.code.codes'
				:min = 'connect.duel.select.code.min'
				:max = 'connect.duel.select.code.max'
				:title = 'connect.duel.select.code.title'
				:cancelable = 'connect.duel.select.code.cancelable'
				key = '2'
			/>
		</TransitionGroup>
		<transition name = 'right_in'>
			<Log v-if = 'connect.chat.show' @exit = 'connect.chat.off'/>
		</transition>
	</main>
</template>
<script setup lang = 'ts'>
	import { onMounted, onUnmounted,watch } from 'vue';

	import Server from './server.vue';
	import Wait from './wait.vue';
	import Button from '@/pages/ui/button.vue';
	import Dialog, { close } from '@/pages/ui/dialog';
	import Card_info from '@/pages/deck/card_info.vue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import GLOBAL from '@/script/scale';
	import { KEYS } from '@/script/constant';

	import connect from './connect';
	import RPS from './rps.vue';
	import Log from './log/log.vue';
	import Scene from './scene/scene';
	import Select_Cards from './selecter/cards.vue';
	import Select_Group from './selecter/group.vue';
	import Select_Codes from './selecter/code.vue';
	import Msg from './ygo-protocol/msg';
	import { CTOS } from './ygo-protocol/network';

	const card_info = {
		width : 360,
		height : GLOBAL.HEIGHT * 0.8
	}
	onMounted(() => {

	});

	onUnmounted(connect.clear);

	const exit = () => connect.state ? connect.close() : emit('exit');

	const emit = defineEmits<{
		exit : []
	}>();

	watch(() => connect.duel.select.confirm.show, (n : boolean) => {
		if (n)
			Dialog({
				title : connect.duel.select.confirm.title,
				message : connect.duel.select.confirm.message,
				closeOnClickOverlay : false
			}, connect.duel.select.confirm.chk)
				.then(async i => await connect.response?.(i))
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
			.info {
				position: fixed;
				left: 0;
				top: 0;
				transform: translateX(calc(-70px - var(--left) / var(--scale)));
			}
			.rps {
				position: fixed;
				top: 100%;
				transform: translate(-50%, calc(var(--top) / var(--scale) - 100px));
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
	.move_in {
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