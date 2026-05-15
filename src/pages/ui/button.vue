<template>
	<var-button
		text outline container
		type = 'primary'
		text-color = 'white'
		size = 'small'
	>
		<span>{{ content }}</span>
		<component v-if = 'icon_name !== undefined' :is = 'svg'/>
	</var-button>
</template>
<script setup lang = 'ts'>
	import { type Component } from 'vue';
	import Search from './svg/search.vue';
	import Chat from './svg/chat.vue';
	import Collapse from './svg/collapse.vue';

	type Icon = 'cards'
		| 'collapse'
		| 'chat'
		| 'search';

	const props = defineProps<{
		icon_name ?: Icon;
		content ?: string;
	}>();
	const svgs : Map<Icon, Component> = new Map ([
		['search', Search],
		['chat', Chat],
		['collapse', Collapse]
	]);
	const svg : null | Component = props.icon_name ? svgs.get(props.icon_name)! : null;
</script>