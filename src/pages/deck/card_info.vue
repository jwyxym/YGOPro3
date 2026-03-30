<template>
	<div
		class = 'no-scrollbar info'
		:style = "{ '--width' : `${width}px`, '--height' : `${height}px` }"
	>
		<div>
			<div :style = "{ '--url' : `url('${page.card.pic}')` }"></div>
			<Button v-show = 'page.card.id' icon_name = 'collapse' @click = 'page.clear'/>
			<div v-show = 'page.card.id'>
				<transition name = 'opacity'>
					<span v-show = 'page.show' class = 'card_name'>{{ page.card.name }}</span>
				</transition>
				<transition name = 'opacity'>
					<span v-show = 'page.show'>{{ page.card.id }}</span>
				</transition>
			</div>
		</div>
		<transition name = 'opacity'>
			<div v-show = 'page.show'>
				<div v-show = 'page.show'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_TYPE) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.type }}</span>
				</div>
				<div></div>
				<div v-show = 'page.card.lv'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_LV) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.lv }}</span>
				</div>
				<div v-if = 'page.card.scale'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_SCALE) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.scale }}</span>
				</div>
				<div v-else></div>
				<div v-show = 'page.card.race'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_RACE) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.race }}</span>
				</div>
				<div v-show = 'page.card.attribute'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_ATTRIBUTE) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.attribute }}</span>
				</div>
				<div v-if = 'page.card.atk'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_ATK) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.atk }}</span>
				</div>
				<div v-else></div>
				<div v-if = 'page.card.def'>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_DEF) }}&nbsp;:&nbsp;</span>
					<span>{{ page.card.def }}</span>
				</div>
				<div v-else></div>
			</div>
		</transition>
		<transition name = 'opacity'>
			<p v-show = 'page.show'>
				<span v-show = 'page.show'>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_DESC) }}&nbsp;:</span>
				<br/>
				{{ page.card.description }}
			</p>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, watch } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Card from '@/script/card';
	import Button from '@/pages/ui/button.vue';

	const emit = defineEmits<{ card : [card : number]; }>();
	const page = reactive({
		show : false,
		card : {
			pic : mainGame.unknown.pic,
			name : '',
			id : 0,
			ot : '',
			lv : '',
			type : '',
			attribute : '',
			race : '',
			description : '',
			setcode : '',
			scale : '',
			atk : '',
			def : ''
		},
		clear : () : void => {
			emit('card', 0);
			page.show = false;
		}
	})

	const props = defineProps<{
		code ?: string | number | Card;
		height : number;
		width : number;
	}>();

	watch(() => props.code, (n) => {
		page.card = {
			pic : mainGame.back.pic,
			name : '',
			id : 0,
			ot : '',
			lv : '',
			type : '',
			attribute : '',
			race : '',
			description : '',
			setcode : '',
			scale : '',
			atk : '',
			def : ''
		}
		if (!n)
			return ;
		if (typeof n === 'string') n = Number(n);
		let card : Card;
		card = typeof n === 'number' ? mainGame.get.card(n) : n;
		page.show = true;
		page.card.id = card.id;
		page.card.pic = card.pic;
		page.card.name = card.name;
		page.card.description = card.desc;
		page.card.type = mainGame.get.strings.type(card.type);
		if (card.is_monster()) {
			page.card.attribute = mainGame.get.strings.attribute(card.attribute);
			page.card.race = mainGame.get.strings.race(card.race);
			page.card.lv = card.level.toString();
			page.card.atk = card.atk >= 0 ? card.atk.toString() : '?';
			if (!card.is_link())
				page.card.def = card.def >= 0 ? card.def.toString() : '?';
			page.card.scale =  card.is_pendulum() ? card.scale.toString() : '';
		}
		console.log(mainGame.get.strings.type(card.type), card.type)
	}, { immediate : true, deep : true });
</script>
<style lang = 'scss' scoped>
	$color-sub : rgb(203, 203, 203);
	.info {
		width: var(--width);
		height: var(--height);
		overflow-y: auto;
		overflow-x: hidden;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		display: flex;
		flex-direction: column;
		> div, > p {
			margin: 10px;
		}
		> div:first-child {
			position: relative;
			width: calc(100% - 10px);
			display: flex;
			flex-direction: column;
			gap: 10px;
			> div:first-child {
				width: 25%;
				aspect-ratio: 1 / 1.45;
				box-shadow: 0 0 10px white;
				background-image: var(--url);
				background-size: cover;
			}
			> button {
				position: absolute;
				right: 5%;
				top: 0;
			}
			> div:last-child {
				display: flex;
				flex-direction: column;
				> span:first-child {
					font-weight: bold;
					font-size: 20px;
				}
				> span:last-child {
					color: $color-sub;
					font-size: 16px;
				}
			}
			+ div {
				display: flex;
				flex-wrap: wrap;
				font-size: 16px;
				> div {
					min-width: 50%;
					display: flex;
					flex-direction: column;
					> span:first-child {
						color: $color-sub;
					}
				}
			}
		}
		> p {
			white-space: pre-line;
			font-size: 16px;
			> span:first-child {
				color: $color-sub;
			}
		}
	}

	.opacity {
		&-enter-active,
		&-leave-active {
			transition: opacity 0.1s ease;
		}

		&-enter-from,
		&-leave-to {
			opacity: 0;
		}

		&-enter-to,
		&-leave-from {
			opacity: 1;
		}
	}
</style>