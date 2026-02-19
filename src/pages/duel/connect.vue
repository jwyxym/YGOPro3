<template>
	<main>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Server
				v-if = '!connect.state'
				@connect = 'connect.on'
				key = '0'
			/>
			<Scene
				v-if = 'connect.state === 1'
				key = '2'
			/>
		</TransitionGroup>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
				@click = "emit('exit')"
				key = '0'
			/>
		</TransitionGroup>
	</main>
</template>
<script setup lang = 'ts'>
	import { onMounted, onUnmounted } from 'vue';

	import Server from './server.vue';
	import Button from '@/pages/ui/button.vue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import connect from './connect';
	import Scene from './scene/scene';

	onMounted(() => {

	});

	onUnmounted(connect.clear);

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
		> div:last-child {
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
</style>