<template>
	<div class = 'loading' :class = "{ 'show' : page.show }">
		<var-loading/>
		<span v-show = 'page.all > 0'>{{ Math.min((page.now / page.all) * 100, 99.99).toFixed(2) }}%</span>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onUnmounted, reactive, watch } from 'vue';
	import { UnlistenFn } from '@tauri-apps/api/event';

	import listen from '@/script/tauri-api/listen';
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
	watch(() => page.show, (n) => emit('loading', n));
</script>
<style scoped lang = 'scss'>
	.loading {
		opacity: 0;
		transition: all 0.1s ease;
		color: white;
		position: fixed;
		right: 0;
		bottom: 0;
		width: 300px;
		height: 100px;
		transform: scale(var(--scale));
		display: flex;
		flex-direction: column;
		align-items: center;
		user-select: none;
		pointer-events: none;
		z-index: 11;
	}
	.show {
		opacity: 1;
	}
</style>