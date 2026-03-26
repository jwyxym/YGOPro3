<template>
	<div class = 'log'>
		<div>
			<div>
				<var-icon name = 'chevron-right' :size = '24' @click = "emit('exit')"/>
			</div>
			<var-tabs v-model:active = 'page.select'>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.DUEL_CHAT) }}</var-tab>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.DUEL_HISTORY) }}</var-tab>
			</var-tabs>
		</div>
		<TransitionGroup tag = 'div' name = 'left_in'>
			<Chat v-show = '!page.select' key = '0'/>
			<div
				v-show = '!page.select'
				key = '1'
			>
				<Input
					variant = 'outlined'
					:maxlength = '256'
				/>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.DUEL_SEND)'
				/>
			</div>
		</TransitionGroup>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive} from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import Input from '@/pages/ui/input.vue';
	import Button from '@/pages/ui/button.vue';

	import Chat from './chat';


	const page = reactive({
		select : 0
	});

	const emit = defineEmits<{
		exit : []
	}>();
</script>
<style scoped lang = 'scss'>
    .log {
		position: relative;
		border: 1px white solid;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		position: fixed;
		right: 0;
		top: 50%;
		width: 500px;
		height: calc(var(--height) * 0.9);
		transform: translate(calc(var(--left) / var(--scale) - 10px), -50%);
		overflow: hidden;
		> div:first-child {
			width: 100%;
			height: 80px;
			position: relative;
			> div:first-child {
				position: absolute;
				left: 0;
				top: 50%;
				height: 50px;
				width: 50px;
				transform: translateY(-50%);
				display: flex;
				justify-content: center;
				align-items: center;
			}
			.var-tabs {
				position: absolute;
				width: calc(100% - 50px * 2);
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
			}
		}
		> div:nth-child(2) {
			position: absolute;
			height: calc(100% - 80px);
			width: 90%;
			top: 80px;
			left: 5%;
			> div:first-child {
				width: 100%;
				height: calc(100% - 80px);
				overflow-y: auto;
			}
			> div:last-child {
				height: 80px;
				display: flex;
				justify-content: center;
				gap: 5%;
				> * {
					transform: translateY(20px);
				}
				.var-input {
					width: 70%;
				}
				.var-button {
					width: 20%;
				}
			}
		}
    }
	.left_in {
		&-enter-active,
		&-leave-active {
			transition: transform 0.1s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translateX(-100%);
		}

		&-enter-to,
		&-leave-from {
			transform: translateX(0);
		}
	}
</style>