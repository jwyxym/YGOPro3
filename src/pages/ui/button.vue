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
	import Cards from './svg/cards.vue';
	import Deck from './svg/deck.vue';
	import Save from './svg/save.vue';
	import Delete from './svg/delete.vue';
	import Share from './svg/share.vue';
	import Home from './svg/home.vue';
	import Add from './svg/add.vue';
	import Search from './svg/search.vue';
	import Setting from './svg/setting.vue';
	import Exit from './svg/exit.vue';
	import Cancel from './svg/cancel.vue';
	import Confirm from './svg/confirm.vue';
	import Download from './svg/download.vue';
	import Refresh from './svg/refresh.vue';
	import Socket from './svg/socket.vue';
	import Chat from './svg/chat.vue';
	import Flag from './svg/flag.vue';
	import Add_person from './svg/add_person.vue';
	import Info from './svg/info.vue';
	import Microphone from './svg/microphone.vue';
	import Clear from './svg/clear.vue';
	import Sort from './svg/sort.vue';
	import Disrupt from './svg/disrupt.vue';
	import Collapse from './svg/collapse.vue';

	type Icon = 'cards'
		| 'deck'
		| 'save'
		| 'delete'
		| 'share'
		| 'home'
		| 'add'
		| 'search'
		| 'setting'
		| 'exit'
		| 'cancel'
		| 'confirm'
		| 'download'
		| 'refresh'
		| 'socket'
		| 'chat'
		| 'flag'
		| 'add_person'
		| 'info'
		| 'microphone'
		| 'clear'
		| 'sort'
		| 'disrupt'
		| 'collapse'
	;

	const props = defineProps<{
		icon_name ?: Icon;
		content ?: string;
	}>();
	const svgs : Map<Icon, Component> = new Map ([
		['cards', Cards],
		['deck', Deck],
		['save', Save],
		['delete', Delete],
		['share', Share],
		['home', Home],
		['add', Add],
		['search', Search],
		['setting', Setting],
		['exit', Exit],
		['cancel', Cancel],
		['confirm', Confirm],
		['download', Download],
		['refresh', Refresh],
		['socket', Socket],
		['chat', Chat],
		['flag', Flag],
		['add_person', Add_person],
		['info', Info],
		['microphone', Microphone],
		['clear', Clear],
		['sort', Sort],
		['disrupt', Disrupt],
		['collapse', Collapse]
	]);
	const svg : null | Component = props.icon_name ? svgs.get(props.icon_name)! : null;

	export type { Icon };
</script>