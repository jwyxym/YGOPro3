<template>
	<div class = 'ygopro3__setting'>
		<var-tabs v-model:active = 'page.select'>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_PACKS) }}</var-tab>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_ITEMS) }}</var-tab>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_OTHER) }}</var-tab>
		</var-tabs>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Expansions v-if = '!page.select' key = '0' :loading = 'loading' :i18n = 'page.i18n'/>
			<System v-if = 'page.select === 1' key = '1' @i18n = '(n : boolean) => page.i18n = n'/>
			<More v-if = 'page.select === 2' key = '1' :i18n = 'page.i18n'/>
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

	import Expansions from './expansions.vue';
	import System from './system.vue';
	import More from './more.vue';
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
	.ygopro3__setting {
		height: calc(var(--height) * 0.9);
		width: calc(var(--width) * 0.9);
		background: rgba(0, 0, 0, 0.5);
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
		:deep(.var-cell) {
			border-bottom: 1px solid white;
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