<template>
	<Popup
		@confirm = "emit('exit', page.ct)"
		:cancelable = 'false'
		:confirmable = 'page.ct !== undefined'
	>
		<template #title>
			{{ title }}
		</template>
		<template #body>
			<div class = 'number'>
				<div>
					<Select
						v-model = 'page.ct'
						name = 'custom'
						:placeholder = 'title'
						:array = 'number.map(i => [i, i])'
					/>
				</div>
			</div>
		</template>
	</Popup>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive } from 'vue';
	import Select from '@/pages/ui/select.vue';
	import Popup from './popup.vue';

	const props = defineProps<{
		number : Array<number>;
		title : string;
	}>();

	const page = reactive({
		show : false,
		ct : undefined as undefined | number
	});

	onBeforeMount(() => props.number.sort((a, b) => a - b))

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