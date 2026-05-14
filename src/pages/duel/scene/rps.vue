<template>
	<div class = 'rps'>
		<img
			class = 'pointer'
			v-for = "(i, v) in [KEYS.S, KEYS.R, KEYS.P]
				.map(i => mainGame.get.textures(KEYS.OTHER, i)) as Array<string>
			"
			:key = 'i'
			:src = 'i'
			@click = "() => emit('click', v + 1)"
		/>
	</div>
</template>

<script setup lang = 'ts'>
	import { KEYS } from '@/script/constant';
	import mainGame from '@/script/game';

	const emit = defineEmits<{
		click : [v : number];
	}>();
</script>

<style scoped lang = 'scss'>
	.rps {
		width: calc(var(--width) * 0.2);
		height: 100px;
		display: flex;
		justify-content: center;
		align-items: center;
		justify-content: space-between;
		> img {
			height: 80%;
		}
	}
</style>