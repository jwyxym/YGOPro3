<template>
	<var-input
		:variant = "variant ? variant : 'standard'"
		:placeholder = 'placeholder'
		:rules = 'rules'
		:clearable = 'true'
		:type = "type ?? 'text'"
		text-color = 'white'
		blur-color = 'white'
		size = 'small'
		@keydown = 'keydown'
		v-model = 'value'
		:maxlength = 'maxlength'
	/>
</template>
<script setup lang = 'ts'>
	import { computed } from 'vue';

	const keydown = async (event : KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey)
			emit('enter');
	};

	const emit = defineEmits<{
		enter : [];
		'update:modelValue' : [v ?: string];
	}>();

	const props = defineProps<{
		modelValue : string | number;
		maxlength ?: number;
		placeholder ?: string;
		variant ?: 'outlined' | 'standard';
		rules ?: ((value ?: string) => string | boolean) | ((value : string) => string | boolean) | ((value ?: string) => Promise<string | boolean>) | ((value : string) => Promise<string | boolean>);
		type ?: 'text' | 'password' | 'number' | 'tel'
	}>();

	const value = computed({
		get : () => typeof props.modelValue === 'string'
			? props.modelValue
			: props.modelValue.toString(),
		set : (v ?: string) => emit('update:modelValue', v ?? '')
	});
</script>