<template>
	<Selecter
		@confirm = "emit('exit', page.plaid)"
		@cancel = "emit('exit')"
		:cancelable = 'cancelable'
		:confirmable = '!!page.plaid'
	>
		<template #title>
			{{ title }}[{{ min }} - 1]
		</template>
		<template #body>
			<var-radio-group
				v-model = 'page.plaid'
				class = 'group'
			>
				<div v-for = '(i, v) in plaids'>
					<div @click.stop = 'page.select(i); page.info(v);' :class = "{ 'disable' : i.disable }">
						<div>
							<img
								v-if = 'cards[v]'
								:src = 'cards[v].get.el.img().src'
								:class = "{ 'defence' : cards[v].pos & POS.DEFENSE }"
							/>
						</div>
						<span>{{ i.name }}</span>
					</div>
					<var-radio :checked-value = 'i' @click = 'page.select(i)' :readonly = 'true'/>
				</div>
			</var-radio-group>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	
	import { POS } from '../ygo-protocol/network';
	import Plaid from '../scene/plaid';
	import Client_Card from '../scene/client_card';
	import Selecter from './selecter.vue';

	const props = defineProps<{
		plaids : Array<Plaid>;
		cards : Array<Client_Card | undefined>;
		title : string;
		min : number;
		cancelable : boolean;
	}>();

	const page = reactive({
		show : false,
		plaid : undefined as Plaid | undefined,
		select : (plaid : Plaid) => page.plaid = page.plaid === plaid ? undefined : plaid,
		info : (v : number) => {
			if (props.cards[v]) emit('click', props.cards[v]);
		}
	});

	const emit = defineEmits<{
		exit : [plaid ?: Plaid];
		click : [card : Client_Card];
	}>();

</script>
<style scoped lang = 'scss'>
	.group {
		height: 100%;
		width: 100%;
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
					flex-direction: column;
					> div:first-child {
						height: calc(100% - 30px);
						aspect-ratio: 1 / 1.3;
						border: 2px solid #9ed3ff;
						display: flex;
						align-content: center;
						align-items: center;
						justify-items: center;
						justify-content: center;
						img {
							height: 90%;
						}
						.defence {
							transform-origin: center center;
							transform: rotateZ(-90deg);
						}
					}
					> .disable {
						box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.6)
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