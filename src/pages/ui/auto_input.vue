<template>
	<var-auto-complete
		ref = 'input'
		:variant = "variant ? variant : 'standard'"
		:placeholder = 'placeholder'
		:rules = 'rules'
		:clearable = 'true'
		text-color = 'white'
		blur-color = 'white'
		size = 'small'
		:get-show = '() => { return true; }'
	/>
</template>
<script setup lang = 'ts'>
	import { ref, onMounted } from 'vue';
	import { _AutoCompleteComponent, Rules } from '@varlet/ui';
	const input = ref<_AutoCompleteComponent | null>(null);
	const exported = {
		blur : undefined as (() => void) | undefined
	};
	onMounted(() => exported.blur = input.value?.blur);
	defineProps<{
		placeholder ?: string;
		rules ?: Rules;
		variant ?: 'outlined' | 'standard';
	}>();
	defineExpose({
		exported
	});
</script>