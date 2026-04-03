<template>
	<div
		:style = "{
			height : `${page.show ? 300 : 30}px`,
		}"
		class = 'popup'
	>
		<div>
			<var-switch v-model = 'page.show'/>
			<slot name = 'title'/>
		</div>
		<div :style = "{ height : `${page.show ? 220 : 0}px`}">
			<slot name = 'body'/>
		</div>
		<div
			:style = "{
				flexDirection : mainGame.get.system(KEYS.SETTING_CHK_SWAP_BUTTON) ? 'initial' : 'row-reverse',
				height : page.show ? '50px' : '0'
			}"
		>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.CONFIRM)'
					@click = "() => confirmable ? emit('confirm') : undefined"
					:style = "{ color : confirmable ? 'white' : 'rgba(255, 255, 255, 0.7)' }"
				/>
			</div>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.CANCEL)'
					@click = "() => cancelable ? emit('cancel') : undefined"
					:style = "{ color : cancelable ? 'white' : 'rgba(255, 255, 255, 0.7)' }"
				/>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import { KEYS } from '@/script/constant';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Button from '@/pages/ui/button.vue';
	const page = reactive({
		show : true
	});
	const props = defineProps<{
		cancelable : boolean;
		confirmable : boolean;
	}>();
	const emit = defineEmits<{
		confirm : [];
		cancel : [];
	}>();
</script>
<style scoped lang = 'scss'>
	.popup {
		position: fixed;
		bottom: 10px;
		transform: translateY(calc(var(--top) / var(--scale)));
		left: calc(var(--width) * 0.35);
		width: calc(var(--width) * 0.3);
		color: white;
		transition: all 0.1s ease;
		> div {
			width: 100%;
		}
		> div:first-child {
			height: 30px;
			display: flex;
			gap: 5px;
		}
		> div:nth-child(2) {
			background-color: rgba(0, 0, 0, 0.5);
			border: 1px solid white;
			height: calc(100% - 80px);
			> * {
				width: 100%;
				height: 100%;
			}
		}
		> div:last-child {
			display: flex;
			overflow: hidden;
			> div {
				flex-grow: 1;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}
</style>