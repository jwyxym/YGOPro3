<template>
	<div class = 'ygopro3__setting'>
		<var-tabs v-model:active = 'page.select.value'>
			<var-tab v-if = '!page.i18n'>{{ mainGame.get.text(I18N_KEYS.SETTING_PACKS) }}</var-tab>
			<var-tab v-if = '!page.i18n'>{{ mainGame.get.text(I18N_KEYS.SETTING_ITEMS) }}</var-tab>
			<var-tab v-if = '!page.i18n'>{{ mainGame.get.text(I18N_KEYS.SETTING_RESOURCE) }}</var-tab>
			<var-tab v-if = '!page.i18n'>{{ mainGame.get.text(I18N_KEYS.SETTING_ABOUT) }}</var-tab>
		</var-tabs>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Expansions v-if = '!page.select.value' key = '0' :loading = 'loading' :i18n = 'page.i18n'/>
			<System v-if = 'page.select.value === 1' key = '1' @i18n = '(n : boolean) => page.i18n = n'/>
			<Resource v-if = 'page.select.value === 2' key = '2' :i18n = 'page.i18n'/>
			<More v-if = 'page.select.value === 3' key = '3' :i18n = 'page.i18n'/>
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
	import Resource from './resource.vue';
	import More from './more.vue';
	
	import Button from '@/pages/ui/button.vue';

	class Select {
		private _value = 0;
		get value () : number {
			return this._value;
		};
		set value (value : number) {
			if (props.loading)
				return;
			this._value = value;
		}
	};

	const page = reactive({
		select : new Select(),
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
		background: rgba(0, 0, 0, 0.2);
		color: white;
		border: 1px solid white;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		align-items: center;
		[media = 'mobile'] & {
			--tab-font-size: 24px;
			--tab-active-font-size: 24px;
			--cell-font-size: 24px;
			:deep(.var-button) {
				transform: scale(160%);
			}
			:deep(.var-select),
			:deep(.var-input),
			:deep(.var-switch) {
				transform: scale(140%);
				transform-origin: left center;
			}
			:deep(.var-select) {
				width: 60%;
			}
			:deep(.var-divider) {
				height: 24px;
				.var-divider__text {
					font-size: 24px;
				}
			}
			:deep(.var-cell) {
				height: 100px;
			}
			:deep(.var-counter) {
				transform: scale(140%);
			}
			:deep(.var-checkbox) {
				transform: scale(120%) translateX(-20px);
			}
			:deep(.var-icon),
			:deep(.var-badge) {
				transform: scale(150%);
			}
		}
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
