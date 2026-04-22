<template>
	<Selecter
		@confirm = 'page.emit'
		:cancelable = 'false'
		:confirmable = 'page.ct !== undefined'
		:width = 'GLOBAL.WIDTH * 0.3'
		:left = 'GLOBAL.WIDTH * 0.35'
	>
		<template #title>
			{{ title }}
		</template>
		<template #body>
			<div class = 'number'>
				<div>
					<Select
						v-model = 'page.ct'
						:multiple = 'ct > 1'
						name = 'custom'
						:placeholder = 'title'
						:array = "page.available.map(i => [i, mainGame.get.strings.race(i)])"
					/>
				</div>
			</div>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive } from 'vue';
	import GLOBAL from '@/script/scale';
	import mainGame from '@/script/game';
	import Select from '@/pages/ui/select.vue';
	import Selecter from './selecter.vue';

	const props = defineProps<{
		available : number;
		ct : number;
		title : string;
	}>();

	const page = reactive({
		available : [] as Array<number>,
		show : false,
		ct : undefined as undefined | number | Array<number>,
		emit : () => {
			const ct = Array.isArray(page.ct) ? page.ct.reduce((acc, val) => acc | val,  0) : page.ct;
			emit('exit', ct);
		}
	});

	onBeforeMount(() => {
		let n = props.available;
		while (n) {
			const bit = n & - n;
			page.available.push(bit);
			n -= bit;
		}
		page.ct = props.ct > 1 ? [] : undefined;
	})

	const emit = defineEmits<{
		exit : [ct ?: number];
	}>();

</script>
<style scoped lang = 'scss'>
	.number {
		height: 100%;
		width: 100%;
		> :deep(div) {
			height: 100%;
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			.var-select {
				width: 80%;
			}
		}
	}
</style>