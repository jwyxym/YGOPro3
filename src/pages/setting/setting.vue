<template>
	<div class = 'setting' :class = "{ 'larger' : GLOBAL.SCALE < 0.4 }">
		<var-tabs v-model:active = 'page.select'>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_PACKS) }}</var-tab>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_ITEMS) }}</var-tab>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_OTHER) }}</var-tab>
		</var-tabs>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Expansions v-show = '!page.select' key = '0' :loading = 'loading' :i18n = 'page.i18n'/>
			<System v-show = 'page.select === 1' key = '1' @i18n = '(n : boolean) => page.i18n = n'/>
		</TransitionGroup>
		<div>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
				@click = "emit('exit')"
				key = '5'
			/>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import GLOBAL from '@/script/scale';

	import Expansions from './expansions.vue';
	import System from './system.vue';
	import Button from '@/pages/ui/button.vue';
	const page = reactive({
		select : 0,
		i18n : false
	});
	const emit = defineEmits<{ exit : []; }>();
	const props = defineProps<{
		loading : boolean
	}>();
</script>
<style scoped lang = 'scss'>
	.setting {
		height: calc(var(--height) * 0.9);
		width: calc(var(--width) * 0.9);
		color: white;
		border: 1px solid white;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		> div {
			width: calc(100% - 20px);
		}
		> div:first-child {
			height: 50px;
		}
		> div:nth-child(2) {
			position: relative;
			height: calc(100% - 100px);
			> div {
				position: absolute;
			}
		}
		> div:last-child {
			display: flex;
			flex-direction: row-reverse;
			align-items: center;
			height: 50px;
			> * {
				margin-right: 20px;
			}
		}
		* {
			transition: 
				font-size 0.3s ease,
				transform 0.3s ease;
		}
	}
	.larger {
		--tab-font-size: 24px;
		--tab-active-font-size: 24px;
		--cell-font-size: 24px;
		--input-input-font-size: 24px;
		--field-decorator-placeholder-size: 24px;
		--select-label-font-size: 24px;
		--option-font-size: 24px;

		:deep(.var-icon), :deep(.var-badge) {
			transform: scale(150%);
		}
		:deep(.setting__loading), :deep(.var-counter) {
			transform: scale(120%);
		}
		:deep(.var-button) {
			transform: scale(160%);
		}
		:deep(.var-cell) {
			height: 100px;
		}
	}

	.opacity {
		&-enter-active,
		&-leave-active {
			transition: opacity 0.2s ease;
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