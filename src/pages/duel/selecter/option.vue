<template>
	<Popup
		@confirm = "emit('exit', page.index)"
		@cancel = "emit('exit')"
		:cancelable = 'cancelable'
		:confirmable = 'page.index !== undefined'
	>
		<template #title>
			{{ title }}
		</template>
		<template #body>
			<div class = 'number'>
				<var-radio-group class = 'no-scrollbar' v-model = 'page.index'>
					<var-cell
						@click = 'page.select(v)'
						v-for = '(i, v) in options'
						:title = 'i'
						:border = 'true'
					>
						<template #extra>
							<var-radio :checked-value = 'v' :readonly = 'true'/>
						</template>
					</var-cell>
				</var-radio-group>
			</div>
		</template>
	</Popup>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import Popup from './popup.vue';

	const props = defineProps<{
		options : Array<string>;
		title : string;
		cancelable : boolean;
	}>();

	const page = reactive({
		show : false,
		index : undefined as undefined | number,
		select : (v : number) => page.index = page.index === v ? undefined : v
	});

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
			overflow-y: auto;
		}
	}
</style>