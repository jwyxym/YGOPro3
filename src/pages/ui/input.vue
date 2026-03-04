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
	/>
</template>
<script setup lang = 'ts'>

	defineProps<{
		placeholder ?: string;
		variant ?: 'outlined' | 'standard';
		rules ?: ((value ?: string) => string | boolean) | ((value : string) => string | boolean) | ((value ?: string) => Promise<string | boolean>) | ((value : string) => Promise<string | boolean>);
		type ?: 'text' | 'password' | 'number' | 'tel'
	}>();
</script>