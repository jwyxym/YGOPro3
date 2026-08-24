<template>
	<div class = 'log ygopro3__duel__log'>
		<div>
			<div>
				<var-icon name = 'chevron-right' :size = '24' @click = "emit('exit')"/>
			</div>
			<var-tabs v-model:active = 'page.select'>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.DUEL_CHAT) }}</var-tab>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.DUEL_HISTORY) }}</var-tab>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_EXTEND) }}</var-tab>
			</var-tabs>
		</div>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Chat v-show = '!page.select' key = '0'/>
			<div
				v-show = '!page.select'
				key = '1'
			>
				<Input
					v-model = 'page.input'
					variant = 'outlined'
					:maxlength = '256'
					@enter = 'page.send'
				/>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.DUEL_SEND)'
					@click = 'page.send'
				/>
			</div>
		</TransitionGroup>
		<transition name = 'opacity'>
			<History v-show = 'page.select === 1' @click = "(i : string | number) => emit('click', i)"/>
		</transition>
		<transition name = 'opacity'>
			<div v-show = 'page.select === 2' class = 'no-scrollbar'>
				<Dglab
					v-if = 'page.dglab'
					:height = '45'
					:icon = 'false'
					@change = 'page.change'
				/>
			</div>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { nextTick, onBeforeMount, reactive, watch} from 'vue';
	import PQueue from 'p-queue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';

	import Input from '@/pages/ui/input.vue';
	import Button from '@/pages/ui/button.vue';
	import connect from '@/pages/duel/connect';
	import Msg from '@/pages/duel/ygo-protocol/msg';
	import { CTOS } from '@/pages/duel/ygo-protocol/network';
	import Dglab from '@/pages/setting/extend/dglab.vue';

	import Chat, { chat } from './chat';
	import History, { history } from './history/history';

	const queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});

	const page = reactive({
		select : 0,
		input : '',
		dglab : false,
		change : (obj : { key : string; value : any; }) => queue
			.add(async () => await mainGame.set.system(obj.key, obj.value)),
		send : async () => {
			if (!page.input) return;
			const send = connect.send?.(new Msg()
				.write.uint8(CTOS.CHAT)
				.write.str(page.input));
			page.input = '';
			await send;
			if (chat.element)
				chat.element.scrollTop = chat.element.scrollHeight;
		}
	});

	const emit = defineEmits<{
		exit : [];
		click : [card : string | number];
	}>();

	watch(() => page.select, async (n) => {
		const el = n ? history.element : chat.element;
		await nextTick();
		if (el) {
			el.scrollTop = el.scrollHeight;
			el.style.scrollBehavior = 'smooth';
		}
	});

	onBeforeMount(() => {
		const extend = mainGame.get.system(KEYS.SETTING_EXTEND) as Array<string>;
		page.dglab = extend.includes('DGLAB');
	});
</script>
<style scoped lang = 'scss'>
	@use './history/history.scss';
    .log {
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
				display: flex;
				justify-content: center;
				align-items: center;
				[media = 'mobile'] & {
					transform: scale(150%) translateY(-50%);
					transform-origin: left top;
				}
				[media = 'pc'] & {
					transform: translateY(-50%);
				}
			}
			.var-tabs {
				position: absolute;
				width: calc(100% - 50px * 2);
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
			}
		}
		> div:nth-child(2), > div:last-child {
			position: absolute;
			height: calc(100% - 80px);
			width: 90%;
			top: 80px;
			left: 5%;
		}
		> div:nth-child(2) {
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
					transform: translateY(15px);
				}
				.var-input {
					[media = 'mobile'] & {
						width: 50%;
						transform: scale(140%) translate(-20%, 10%);
						transform-origin: left top;
					}
					[media = 'pc'] & {
						width: 70%;
					}
				}
				.var-button {
					[media = 'mobile'] & {
						transform: scale(140%) translate(20%, 35%);
						transform-origin: left top;
					}
					[media = 'pc'] & {
						width: 20%;
					}
				}
			}
		}
		> div:nth-child(4) {
			overflow-y: auto;
			width: 90%;
			height: calc(100% - 80px);
			:deep(.var-cell) {
				height: 60px;
				border-bottom: 1px solid white;
				.var-cell__extra {
					display: flex;
					transform: translateX(-10px);
					.var-input {
						width: 150px;
						[media = 'mobile'] & {
							transform: scale(140%) translate(-10px, -10px);
						}
					}
				}
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