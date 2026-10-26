<template>
	<main class = 'ygopro3__menu'>
		<div>
			<Title/>
			<Cards :active = 'active'/>
		</div>
		<div>
			<span
				v-for = 'i in page.menu'
				:class = "{ 'select' : page.select === i }"
				@click = 'page.click(i)'
				@mouseenter = 'page.mouseenter(i)'
				@mouseleave = 'page.mouseleave'
				class = 'pointer'
			>{{ mainGame.get.text(i) }}</span>
		</div>
	</main>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import Cards from './cards.vue';
	import Title from './title.vue';

	const props = withDefaults(defineProps<{
		active ?: boolean;
	}>(), {
		active : true
	});

	const page = reactive({
		select : - 1,
		menu : __WEB__ ? [
				I18N_KEYS.MENU_CONNECT,
				I18N_KEYS.MENU_REPLAY,
				I18N_KEYS.MENU_DECK,
				I18N_KEYS.MENU_CARD,
				I18N_KEYS.MENU_SETTING,
				I18N_KEYS.MENU_EXIT
			] : [
				I18N_KEYS.MENU_SINGLE,
				I18N_KEYS.MENU_CONNECT,
				I18N_KEYS.MENU_REPLAY,
				I18N_KEYS.MENU_DECK,
				I18N_KEYS.MENU_CARD,
				I18N_KEYS.MENU_SETTING,
				I18N_KEYS.MENU_EXIT
			],
		pointer : new Array(2).fill(-1000),
		click : (v : number) : void => {
			if (page.select !== v)
				page.select = v;
			page.to();
		},
		mouseenter : (v : number) : void => {
			if (!__ANDROID__)
				page.select = v;
		},
		mouseleave : () : void => {
			if (!__ANDROID__)
				page.select = - 1;
		},
		to : async () : Promise<void> => {
			if (__ANDROID__)
				await mainGame.sleep(200);
			switch (page.select) {
				case I18N_KEYS.MENU_SINGLE:
					emit('single');
					break;
				case I18N_KEYS.MENU_CONNECT:
					emit('server');
					break;
				case I18N_KEYS.MENU_REPLAY:
					emit('replay');
					break;
				case I18N_KEYS.MENU_DECK:
					emit('deck');
					break;
				case I18N_KEYS.MENU_CARD:
					emit('card');
					break;
				case I18N_KEYS.MENU_SETTING:
					emit('setting');
					break;
				case I18N_KEYS.MENU_EXIT:
					emit('exit');
					break;
			}
		}
	});

	const emit = defineEmits<{
		single : [];
		server : [];
		replay : [];
		deck : [];
		card : [];
		setting : [];
		exit : [];
	}>();
</script>
<style scoped lang = 'scss'>
	main {
		[media = 'mobile'] & {
			font-size: 64px;
		}
		[media = 'pc'] & {
			font-size: 48px;
		}
		height: calc(var(--height) * 0.9);
		width: calc(var(--width) * 0.9);
		display: flex;
		color: white;
		> div {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		> div:first-child {
			width: 70%;
		}
		> div:nth-child(2) {
			width: 30%;
			justify-content: center;
			span {
				width: 300px;
				position: relative;
				font-weight: 900;
				transition: all 0.2s ease;
				&::after {
					transition: all 0.2s ease;
					content: '<';
					position: absolute;
					right: 0;
					opacity: 0;
					transform: translateX(-100px);
				}
			}
			.select {
				text-shadow:
					0 0 5px aqua,
					0 0 10px aqua,
					0 0 20px aqua,
					0 0 40px aqua;
				&::after {
					opacity: 1;
					[media = 'mobile'] & {
						transform: translateX(20px);
					}
					[media = 'pc'] & {
						transform: translateX(-55px);
					}
				}
			}
		}
	}
</style>
