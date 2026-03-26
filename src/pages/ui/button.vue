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
	import Save from './svg/save.vue';
	import Share from './svg/share.vue';
	import Search from './svg/search.vue';
	import Chat from './svg/chat.vue';
	import Clear from './svg/clear.vue';
	import Sort from './svg/sort.vue';
	import Disrupt from './svg/disrupt.vue';
	import Collapse from './svg/collapse.vue';

	type Icon = 'cards'
		| 'save'
		| 'share'
		| 'clear'
		| 'sort'
		| 'disrupt'
		| 'collapse'
		| 'chat'
		| 'search';

	const props = defineProps<{
		icon_name ?: Icon;
		content ?: string;
	}>();
	const svgs : Map<Icon, Component> = new Map ([
		['save', Save],
		['share', Share],
		['search', Search],
		['chat', Chat],
		['clear', Clear],
		['sort', Sort],
		['disrupt', Disrupt],
		['collapse', Collapse]
	]);
	const svg : null | Component = props.icon_name ? svgs.get(props.icon_name)! : null;

	export type { Icon };
</script>