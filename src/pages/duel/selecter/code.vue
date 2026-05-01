<template>
	<Selecter
		@confirm = "emit('exit', page.card)"
		@cancel = "emit('exit')"
		:cancelable = 'false'
		:confirmable = '!!page.card'
	>
		<template #title>
			<div class = 'title'>
				<span>{{ title }}</span>
				<Input
					:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_NAME)'
					variant = 'outlined'
					v-model = 'page.input'
				/>
				<var-pagination
					:current = 'page.ct'
					@update:current = 'page.update'
					:total = 'page.cards.length / 100'
					:show-size-changer = 'false'
				/>
			</div>
		</template>
		<template #body>
			<var-radio-group
				v-model = 'page.card'
				class = 'group'
			>
				<div v-for = 'i in page.cards
					.slice((page.ct - 1) * 100, page.ct * 100)'
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
	import { computed, reactive, watch } from 'vue';
	import PQueue from 'p-queue';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import Input from '@/pages/ui/input.vue';

	import Selecter from './selecter.vue';

	const queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});

	const props = defineProps<{
		cards : Array<number>;
		title : string;
	}>();
	const page = reactive({
		ct : 1,
		input : '',
		show : false,
		card : 0,
		select : (card : number) => page.card = page.card === card ? 0 : card,
		cards : computed(() : Array<number> => props.cards
			.filter(i => page.input
				? i.toString().includes(page.input)
					|| mainGame.get.card(i).name.includes(page.input)
				: true)
		),
		update : (ct : number) => queue.add(async () => {
			await mainGame.load.pic(page.cards.slice((ct - 1) * 100, ct * 100))
			page.ct = ct;
		})
	});

	watch(() => page.input, () => page.ct = 1);

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
		.var-pagination {
			position: absolute;
			right: 0;
			--pagination-text-color: white !important;
			width: 20%;
		}
	}
	.group {
		height: 100%;
		> :deep(div) {
			height: 100%;
			display: flex;
			flex-wrap: nowrap;
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