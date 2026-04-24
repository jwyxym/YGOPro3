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
	/>
</template>
<script setup lang = 'ts'>
	const keydown = async (event : KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey)
			emit('enter');
	};

	const emit = defineEmits<{
		enter : [];
	}>();

	defineProps<{
		placeholder ?: string;
		variant ?: 'outlined' | 'standard';
		rules ?: ((value ?: string) => string | boolean) | ((value : string) => string | boolean) | ((value ?: string) => Promise<string | boolean>) | ((value : string) => Promise<string | boolean>);
		type ?: 'text' | 'password' | 'number' | 'tel'
	}>();
</script>