<template>
	<Selecter
		@confirm = "emit('exit', page.cards)"
		@cancel = "emit('exit')"
		:cancelable = 'cancelable'
		:confirmable = '!!page.cards'
	>
		<template #title>
			<div class = 'title'>
				<span>{{ title }} [{{ min }} - {{ max }}]</span>
				<Input
					:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_NAME)'
					variant = 'outlined'
					v-model = 'page.input'
				/>
			</div>
		</template>
		<template #body>
			<var-radio-group
				v-model = 'page.cards'
				class = 'group'
			>
				<div v-for = 'i in cards
					.filter(i => page.input
						? i.toString().includes(page.input) || mainGame.get.card(i).name.includes(page.input)
						: true)'
				>
					<div @click.stop = "page.select(i); emit('click', i);">
						<img :src = 'mainGame.get.card(i).pic'/>
						<span>[{{ mainGame.get.card(i).name }}]</span>
					</div>
					<var-radio :checked-value = 'i' @click = 'page.select(i)' :readonly = 'true'/>
				</div>
			</var-radio-group>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import Input from '@/pages/ui/input.vue';

	import Selecter from './selecter.vue';

	const props = defineProps<{
		cards : Array<number>;
		title : string;
		min : number;
		max : number;
		cancelable : boolean;
	}>();
	const page = reactive({
		input : '',
		show : false,
		cards : 0,
		select : (card : number) => page.cards = page.cards === card ? 0 : card
	});

	const emit = defineEmits<{
		exit : [card ?: number];
		click : [card : number];
	}>();

</script>
<style scoped lang = 'scss'>
	.title {
		width: 100%;
		height: 50px;
		display: flex;
		gap: 10px;
		.var-input {
			transform: translateY(-20px);
			width: 40%;
		}
	}
	.group {
		> :deep(div) {
			height: 100%;
			display: flex;
			flex-wrap: nowrap;
			overflow-x: auto;
			> div {
				flex-shrink: 0;
				position: relative;
				height: calc(100% - 10px);
				width: 200px;
				> div:first-child {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					height: 100%;
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					flex-direction: column;
					> img {
						height: calc(100% - 40px);
					}
				}
				.var-radio {
					position: absolute;
					top: 0;
					right: 0;
				}
			}
		}
	}
</style>