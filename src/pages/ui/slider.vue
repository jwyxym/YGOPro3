<template>
	<div
		class = 'slider'
		:style = "{ '--width' : `${page.x}px`, '--base_width' : `${page.width}px` }"
		@touchstart = 'page.touchstart'
		@mousedown = 'page.mousedown'
	>
		<div></div>
		<div></div>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onUnmounted, reactive } from 'vue';
	import GLOBAL from '@/script/scale';

	const page = reactive({
		x : 0,
		width : 1200,
		left : 0,
		on : false,
		clamp : (v : number) : number => Math.min(1, Math.max(0, v)),
		computed : (x : number) : number => (x - page.left) / (page.width * GLOBAL.SCALE),
		start : (x : number) => {
			const ratio = page.clamp(page.computed(x));
			page.x = page.width * ratio;
			emit('dragging', ratio);
			page.on = true;
		},
		move : (x : number) => {
			if (page.on) {
				const ratio = page.clamp(page.computed(x));
				page.x = page.width * ratio;
				emit('dragging', ratio);
			}
		},
		end : () => {
			if (page.on)
				emit('drag_end', page.x / page.width);
			page.on = false;
		},
		touchstart : (e : TouchEvent) => {
			const target = e.target as HTMLElement;
			if (!page.left)
				page.left = target.getBoundingClientRect().left ?? 0;
			page.start(e.touches[0].clientX);
		},
		touchmove : (e : TouchEvent) => page.move(e.touches[0].clientX),
		mousedown : (e : MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!page.left)
				page.left = target.getBoundingClientRect().left ?? 0;
			if (e.button !== 2)
				page.start(e.clientX);
		},
		mousemove : (e : MouseEvent) => page.move(e.clientX)
	});

	onBeforeMount(async () => {
		page.x = props.x * page.width;
		window.addEventListener('mousemove', page.mousemove);
		window.addEventListener('touchmove', page.touchmove);
		window.addEventListener('mouseup', page.end);
		window.addEventListener('touchend', page.end);
	});

	onUnmounted(() => {
		window.removeEventListener('mousemove', page.mousemove);
		window.removeEventListener('touchmove', page.touchmove);
		window.removeEventListener('mouseup', page.end);
		window.removeEventListener('touchend', page.end);
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
		pointer-events: none;
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
			pointer-events: initial;
		}
		> div:last-child {
			background-color: #397bfe;
			width: min(var(--width), var(--base_width));
			z-index: 999;
			pointer-events: none;
		}
	}
</style>