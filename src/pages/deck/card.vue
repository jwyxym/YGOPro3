<template>
	<div class = 'card'
		:style = "{
			'--url' : `url('${pic}')`,
			'--card_height' : `${height}px`,
			'--card_width' : `${width}px`
		}"
		:data-id = 'id'
	>
		<div
			class = 'badge font-atk'
			:style = "{ '--color' : color }"
			v-if = 'type'
		>
			{{ count }}
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { computed } from 'vue';

	const props = defineProps<{
		pic : string;
		id : number;
		width : number;
		height : number;
		count ?: number;
		type ?: 'lflist' | 'glist'
	}>();

	const color = computed(() => props.type === 'lflist'
		? 'aqua' : props.type === 'glist'
			? 'hotpink' : 'initial'
	);
</script>
<style lang = 'scss' scoped>
	.card {
		height: var(--card_height);
		width: var(--card_width);
		background-image: var(--url);
		background-size: cover;
		z-index: 0;
		> div {
			position: absolute;
			left: 0;
			top: 0;
			height: calc(var(--card_width) * 0.4);
			width: calc(var(--card_width) * 0.4);
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: 50%;
			border-width: 1px;
			border-style: solid;
			white-space: nowrap;
			background-color: black;
			border-color: var(--color);
			color: var(--color);
		}
	}
</style>