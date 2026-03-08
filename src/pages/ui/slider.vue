<template>
	<div class = 'slider' ref = 'slider' :style = "{ '--width' : `${page.x}px`, '--base_width' : `${page.width}px` }">
		<div></div>
		<div></div>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onUnmounted, reactive, ref } from 'vue';
	import GLOBAL from '@/script/scale';

	const slider = ref<HTMLElement | null>(null);
	const page = reactive({
		x : 0,
		width : 1200,
		on : false,
		start : (target : HTMLElement, x : number) => {
			if (slider.value?.contains(target)) {
				page.x = Math.max(0, (x / GLOBAL.SCALE) - GLOBAL.LEFT * 2 - 30);
				emit('dragging', Math.min(1, page.x / page.width));
				page.on = true;
			}
		},
		move : (x : number) => {
			if (page.on) {
				page.x = Math.max(0, (x / GLOBAL.SCALE) - GLOBAL.LEFT * 2 - 30);
				emit('dragging', Math.min(1, page.x / page.width));
			}
		},
		end : (x : number) => {
			if (page.on) {
				page.x = Math.max(0, (x / GLOBAL.SCALE) - GLOBAL.LEFT * 2 - 30);
				emit('drag_end', Math.min(1, Math.min(1, page.x / page.width)));
				page.on = false;
			}
		},
		touchstart : (e : TouchEvent) => page.start(e.target as HTMLElement, e.touches[0].clientX),
		touchmove : (e : TouchEvent) => page.move(e.touches[0].clientX),
		touchend : (e : TouchEvent) => page.end(e.touches[0].clientX),
		mousedown : (e : MouseEvent) => e.button === 2 ? false : page.start(e.target as HTMLElement, e.clientX),
		mousemove : (e : MouseEvent) => page.move(e.clientX),
		mouseup : (e : MouseEvent) => page.end(e.clientX)
	});

	onBeforeMount(async () => {
		page.x = props.x * page.width;
		window.addEventListener('mousedown', page.mousedown);
		window.addEventListener('mousemove', page.mousemove);
		window.addEventListener('mouseup', page.mouseup);
		window.addEventListener('touchstart', page.touchstart);
		window.addEventListener('touchmove', page.touchmove);
		window.addEventListener('touchend', page.touchend);
	});

	onUnmounted(() => {
		window.removeEventListener('mousedown', page.mousedown);
		window.removeEventListener('mousemove', page.mousemove);
		window.removeEventListener('mouseup', page.mouseup);
		window.removeEventListener('touchstart', page.touchstart);
		window.removeEventListener('touchmove', page.touchmove);
		window.removeEventListener('touchend', page.touchend);
	});

	const props = defineProps<{
		x : number
	}>();
	
	const emit = defineEmits<{
		dragging : [v : number];
		drag_end : [v : number];
	}>();
</script>
<style scoped lang = 'scss'>
	.slider {
		position: relative;
		height: 20px;
		> div {
			position: absolute;
			left: 0;
			transform: translateY(-50%);
			top: 50%;
			height: 25%;
		}
		> div:first-child {
			background-color: white;
			width: var(--base_width);
		}
		> div:last-child {
			background-color: #397bfe;
			width: min(var(--width), var(--base_width));
			z-index: 999;
		}
	}
</style>