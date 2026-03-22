<template>
	<div
		:style = "{ '--h' : `${page.show ? 300 : 80}px`}"
		class = 'selecter'
	>
		<div>
			<var-switch v-model = 'page.show'/>
			<slot name = 'title'/>
		</div>
		<div>
			<slot name = 'body'/>
		</div>
		<div
			:style = "{
				flexDirection : mainGame.get.system(KEYS.SETTING_CHK_SWAP_BUTTON) ? 'initial' : 'row-reverse'
			}"
		>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.CONFIRM)'
					@click = "emit('confirm')"
				/>
			</div>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.CANCEL)'
					@click = "emit('cancel')"
					v-if = 'cancelable'
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
	}>();
	const emit = defineEmits<{
		confirm : [];
		cancel : [];
	}>();
</script>
<style scoped lang = 'scss'>
	.selecter {
		position: fixed;
		bottom: 0;
		left: calc(var(--width) * 0.15);
		width: calc(var(--width) * 0.7);
		height: var(--h);
		color: white;
		transition: all 0.1s ease;
		> div {
			width: 100%;
		}
		> div:first-child {
			height: 30px;
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
			height: 50px;
			display: flex;
			> div {
				flex-grow: 1;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}
</style>