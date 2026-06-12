<template>
	<div class = 'card'
		:class = "{ 'hover' : hover, 'show' : !!i.loc }"
		:style = "{
			'--position_x' :  `${(i.index % count) * size.width + 2}px`,
			'--position_y' :  `${(Math.trunc(i.index / count) + i.y) * size.height + i.loc}px`,
			'--url' : `url('${mainGame.get.card(i.code).pic}')`,
			'--card_height' : `${size.height}px`,
			'--card_width' : `${size.width}px`
		}"
		ref = 'cards'
	>
		<var-badge
			type = 'info'
			v-if = 'get_g(i.code)'
			:value = 'get_g(i.code)'
		/>
		<var-badge
			type = 'danger'
			v-else-if = 'get_lf(i.code)'
			:value = 'get_lf(i.code)'
		/>
	</div>
</template>
<script setup lang = 'ts'>
	import mainGame from '@/script/game';
	import { KEYS } from '@/script/constant';
	import LFList from '@/script/lflist';

	interface CardPic { code : number; index : number; y : number; loc : number; key : string; };
	type CardPics = Array<CardPic>;	

	const props = defineProps<{
		i : CardPic;
		hover : boolean;
		size : { width : number; height : number; }
		count : number;
		lflist ?: LFList;
	}>();

	const get_lf = (code : number) : string => {
		const lf = props.lflist?.get?.lflist?.(code);
		if (lf !== mainGame.get.system(KEYS.SETTING_CT_CARD))
			return lf?.toString() ?? '';
		return '';
	};
	const get_g = (code : number) : string => {
		const g = props.lflist?.genesys ? props.lflist.get.glist(code) : undefined;
		return g === 0 ? '' : g?.toString() ?? '';
	};

	export type { CardPic, CardPics };
</script>
<style lang = 'scss' scoped>
	.card {
		will-change: transform;
		position: absolute;
		left: 0;
		top: 0;
		opacity: 0;
		height: var(--card_height);
		width: var(--card_width);
		transform: translate(var(--position_x), var(--position_y));
		background-image: var(--url);
		background-size: cover;
		z-index: 0;
	}
	.show {
		opacity: 1;
		transition: transform 0.1s ease;
	}
	.hover {
		position: fixed;
		opacity: 0;
		left: 0;
		top: 0;
		z-index: 1;
	}
</style>