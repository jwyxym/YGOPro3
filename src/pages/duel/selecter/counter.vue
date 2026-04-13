<template>
	<Selecter
		@confirm = "emit('exit', page.count)"
		@cancel = "emit('exit')"
		:cancelable = 'false'
		:confirmable = 'page.ct === count'
	>
		<template #title>
			<div class = 'title'>
				<span>{{ title }}</span>
				<img :src = 'mainGame.get.counter(counter)'/>
				<span>{{ mainGame.get.text(I18N_KEYS.DUEL_SELECT) }}: {{ page.ct }}/{{ count }}</span>
			</div>
		</template>
		<template #body>
			<div
				class = 'group'
			>
				<div v-for = '(i, v) in cards'>
					<div @click.stop = "emit('click', i)">
						<img :src = 'mainGame.get.card(i.id).pic'/>
						<div>
							<img :src = 'mainGame.get.counter(counter)'/>
							{{ counts[v] }}
						</div>
						<span>[{{ mainGame.get.card(i.id).name }}]</span>
					</div>
					<var-counter
						@click.stop = "emit('click', i)"
						v-model = 'page.count[v]'
						:max = 'counts[v]'
						:min = '0'
						:disable-input = 'true'
					/>
				</div>
			</div>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { reactive, computed } from 'vue';
	import lodash from 'lodash';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import Selecter from './selecter.vue';
	import Client_Card from '../scene/client_card';

	const props = defineProps<{
		cards : Array<Client_Card>;
		counter : number;
		title : string;
		count : number;
		counts : Array<number>;
	}>();
	const page = reactive({
		input : '',
		show : false,
		count : props.cards.map(_ => 0) as Array<number>,
		ct : computed(() : number => lodash.sum(page.count))
	});

	const emit = defineEmits<{
		exit : [card ?: Array<number>];
		click : [card : Client_Card];
	}>();

</script>
<style scoped lang = 'scss'>
	.title {
		width: 100%;
		height: 50px;
		display: flex;
		gap: 10px;
		> img {
			height: 50%;
		}
	}
	.group {
		display: flex;
		flex-wrap: nowrap;
		overflow-x: auto;
		> :deep(div) {
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
				> div {
					position: absolute;
					background-color: rgba(0, 0, 0, 0.5);
					top: calc(65% - 30px);
					left: 25%;
					height: 25px;
					display: flex;
					align-items: center;
					user-select: none;
					> img {
						height: 100%;
					}
				}
			}
			.var-counter {
				--counter-background: rgba(0, 0, 0, 0.5) !important;
				position: absolute;
				top: 65%;
				left: 50%;
				transform: translateX(-50%);
			}
		}
	}
</style>