<template>
	<div class = 'loading ygopro3__loading' :style = "{ '--opacity' : Number(page.show) }">
		<div v-if = 'init' class = 'load'>
			<var-loading/>
			<span v-show = 'page.all > 0'>{{ Math.min((page.now / page.all) * 100, 99.99).toFixed(2) }}%</span>
		</div>
		<div v-else class = 'init'>
			<div :style = "{
				'--current' : (page.now / page.all).toString()
			}">
				<div/>
				<span v-show = 'page.all > 0'>{{ Math.min((page.now / page.all) * 100, 99.99).toFixed(2) }}%</span>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onUnmounted, reactive, watch } from 'vue';
	import { UnlistenFn } from '@tauri-apps/api/event';

	import listen from '@/script/listen';
	import mainGame from '@/script/game';

	const page = reactive({
		show : false,
		all : 0,
		now : 0,
		funcs : [] as Array<UnlistenFn>
	});

	onBeforeMount(async () => {
		page.funcs.push(await listen.start((all : number) => {
			page.all = all;
			page.now = 0;
			page.show = true;
		}));
		page.funcs.push(await listen.progress((progress : number) => page.now += progress));
		page.funcs.push(await listen.end(async () => {
			page.now = page.all;
			page.show = false;
			await mainGame.sleep(100);
			page.all = 0;
			page.now = 0;
		}));
	});

	onUnmounted(() => {
		for (const i of page.funcs)
			i();
	});

	const emit = defineEmits<{ loading : [boolean]; }>();
	const props = defineProps<{ init : boolean }>();
	watch(() => page.show, (n) => emit('loading', n));
</script>
<style scoped lang = 'scss'>
	.loading {
		position: relative;
		opacity: var(--opacity);
		transition: all 0.1s ease;
		color: white;
		z-index: 11;
		user-select: none;
		pointer-events: none;
		.load {
			position: fixed;
			right: 0;
			bottom: 0;
			width: 300px;
			height: 100px;
			display: flex;
			flex-direction: column;
			align-items: center;
			font-size: 20px;
			[media = 'mobile'] & {
				transform: scale(1.6);
			}
		}
		.init {
			position: absolute;
			height: 100%;
			width: 100%;
			> div {
				position: relative;
				left: 50%;
				bottom: 0;
				width: 80%;
				height: 10px;
				background: transparent;
				border: 2px solid white;
				border-radius: 8px;
				transform: translate(-50%, calc(var(--height) * 0.9));
				[media = 'mobile'] & {
					font-size: 32px;
				}
				[media = 'pc'] & {
					font-size: 20px;
				}
				> div {
					width: calc(100% * var(--current));
					height: 100%;
					background-color: white;
				}
				> span {
					position: absolute;
					[media = 'mobile'] & {
						transform: translateY(-70px);
					}
					[media = 'pc'] & {
						transform: translateY(-50px);
					}
				}
			}
		}
	}
</style>