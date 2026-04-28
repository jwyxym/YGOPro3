<template>
	<Selecter
		@confirm = "emit('exit', page.pos)"
		:cancelable = 'false'
		:confirmable = '!!page.pos'
	>
		<template #title>
			{{ title }}
		</template>
		<template #body>
			<var-radio-group
				v-model = 'page.pos'
				class = 'group'
			>
				<div v-if = '(pos & POS.FACEUP_ATTACK) === POS.FACEUP_ATTACK'>
					<div @click = 'page.select(POS.FACEUP_ATTACK)'>
						<img :src = 'mainGame.get.card(id).pic'/>
					</div>
					<var-radio
						:checked-value = 'POS.FACEUP_ATTACK'
						@click = 'page.select(POS.FACEUP_ATTACK)'
						:readonly = 'true'
					/>
				</div>
				<div v-if = '(pos & POS.FACEUP_DEFENSE) === POS.FACEUP_DEFENSE'>
					<div @click = 'page.select(POS.FACEUP_DEFENSE)'>
						<img :src = 'mainGame.get.card(id).pic' class = 'selecter__pos__defense'/>
					</div>
					<var-radio
						:checked-value = 'POS.FACEUP_DEFENSE'
						@click = 'page.select(POS.FACEUP_DEFENSE)'
						:readonly = 'true'
					/>
				</div>
				<div v-if = '(pos & POS.FACEDOWN_ATTACK) === POS.FACEDOWN_ATTACK'>
					<div @click = 'page.select(POS.FACEDOWN_ATTACK)'>
						<img :src = 'mainGame.back.pic'/>
					</div>
					<var-radio
						:checked-value = 'POS.FACEDOWN_ATTACK'
						@click = 'page.select(POS.FACEDOWN_ATTACK)'
						:readonly = 'true'
					/>
				</div>
				<div v-if = '(pos & POS.FACEDOWN_DEFENSE) === POS.FACEDOWN_DEFENSE'>
					<div @click = 'page.select(POS.FACEDOWN_DEFENSE)'>
						<img :src = 'mainGame.back.pic' class = 'selecter__pos__defense'/>
					</div>
					<var-radio
						:checked-value = 'POS.FACEDOWN_DEFENSE'
						@click = 'page.select(POS.FACEDOWN_DEFENSE)'
						:readonly = 'true'
					/>
				</div>
			</var-radio-group>
		</template>
	</Selecter>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import mainGame from '@/script/game';
	import { POS } from '@/pages/duel/ygo-protocol/network';
	import Selecter from './selecter.vue';

	const props = defineProps<{
		pos : number;
		id : number;
		title : string;
	}>();

	const page = reactive({
		show : false,
		pos : 0,
		select : (pos : number) => page.pos = page.pos === pos ? 0 : pos
	});

	const emit = defineEmits<{
		exit : [pos : number];
	}>();

</script>
<style scoped lang = 'scss'>
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
				aspect-ratio: 1 / 1;
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
					> img {
						height: calc(100% - 40px);
					}
					> .selecter__pos__defense {
						transform-origin: center center;
						transform: rotateZ(-90deg);
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