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
				@deck = 'connect.wait.deck'
				@duelist = 'connect.wait.duelist'
				@watcher = 'connect.wait.watcher'
				@connect = 'connect.on'
				@disconnect = 'connect.clear'
				key = '1'
			/>
			<Scene
				v-if = 'connect.state === 2'
				key = '2'
			/>
		</TransitionGroup>
		<div>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
				@click = 'exit'
				key = '0'
			/>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.DUEL_HISTORY)'
				@click = 'connect.chat.on'
				v-show = 'connect.state'
				key = '1'
			/>
		</div>
		<TransitionGroup tag = 'div' name = 'bottom_in'>
			<Select_Cards
				v-if = 'connect.select.cards.show'
				:cards = 'connect.select.cards.cards'
				:min = 'connect.select.cards.min'
				:max = 'connect.select.cards.max'
				:title = 'connect.select.cards.title'
				:cancelable = 'connect.select.cards.cancelable'
				key = '0'
			/>
			<Select_Group
				v-if = 'connect.select.group.show'
				:select = 'connect.select.group.select'
				:unselect = 'connect.select.group.unselect'
				:min = 'connect.select.group.min'
				:max = 'connect.select.group.max'
				:title = 'connect.select.group.title'
				:cancelable = 'connect.select.group.cancelable'
				key = '1'
			/>
			<Select_Codes
				v-if = 'connect.select.code.show'
				:cards = 'connect.select.code.codes'
				:min = 'connect.select.code.min'
				:max = 'connect.select.code.max'
				:title = 'connect.select.code.title'
				:cancelable = 'connect.select.code.cancelable'
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

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import connect from './connect';
	import Scene from './scene/scene';
	
	import Select_Cards from './selecter/cards.vue';
	import Select_Group from './selecter/group.vue';
	import Select_Codes from './selecter/code.vue';
	import Log from './log/log.vue';

	onMounted(() => {
	});

	onUnmounted(connect.clear);

	const exit = () => connect.state ? connect.clear() : emit('exit');

	const emit = defineEmits<{
		exit : []
	}>();

	watch(() => connect.select.confirm.show, (n : boolean) => {
		if (n)
			Dialog({
				title : connect.select.confirm.title,
				message : connect.select.confirm.message,
				closeOnClickOverlay : false
			}, connect.select.confirm.chk)
				.then(async i => await (i ? connect.select.confirm.confirm
					: connect.select.confirm.cancel)?.())
		else close();
	});
</script>
<style scoped lang = 'scss'>
	main {
		position: relative;
		height: calc(var(--height) * 0.9);
		width: calc(var(--width) * 0.9);
		> div:first-child {
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