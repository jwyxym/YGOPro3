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
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
				@click = 'exit'
				key = '0'
			/>
		</TransitionGroup>
		<TransitionGroup tag = 'div' name = 'move_in'>
			<Select_Cards
				v-if = 'connect.select_cards.show'
				:cards = 'connect.select_cards.cards'
				:min = 'connect.select_cards.min'
				:max = 'connect.select_cards.max'
				:title = 'connect.select_cards.title'
				:cancelable = 'connect.select_cards.cancelable'
				key = '0'
			/>
		</TransitionGroup>
	</main>
</template>
<script setup lang = 'ts'>
	import { onMounted, onUnmounted } from 'vue';

	import Server from './server.vue';
	import Wait from './wait.vue';
	import Button from '@/pages/ui/button.vue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import connect from './connect';
	import Scene from './scene/scene';
	
	import Select_Cards from './selecter/cards.vue';

	onMounted(() => {
	});

	onUnmounted(connect.clear);

	const exit = () => connect.state ? connect.clear() : emit('exit');

	const emit = defineEmits<{
		exit : []
	}>();
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
			flex-direction: column;
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
			transform: translateY(0);
		}
	}
</style>