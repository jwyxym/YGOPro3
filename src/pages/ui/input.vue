<template>
	<var-input
		:variant = "variant ? variant : 'standard'"
		:placeholder = "typeof placeholder === 'object' ? placeholder.value : placeholder"
		:rules = 'rules'
		:clearable = 'true'
		:type = "type ?? 'text'"
		text-color = 'white'
		blur-color = 'white'
		size = 'small'
	/>
</template>
<script setup lang = 'ts'>
import { ComputedRef } from 'vue';

	defineProps<{
		placeholder ?: string | ComputedRef<string>;
		variant ?: 'outlined' | 'standard';
		rules ?: ((value ?: string) => string | boolean) | ((value : string) => string | boolean) | ((value ?: string) => Promise<string | boolean>) | ((value : string) => Promise<string | boolean>);
		type ?: 'text' | 'password' | 'number' | 'tel'
	}>();
</script>