<template>
	<main class = 'font-menu'>
		<div>
			<div>
				<span>
					{{ page.time.hour }} : {{ page.time.minute }} : {{ page.time.second }}
				</span>
				<span>{{ page.time.year }} - {{ page.time.month }} - {{ page.time.day }}</span>
			</div>
			<News/>
		</div>
		<div>
			<span
				v-for = '(i, v) in page.menu'
				:class = "{ 'select' : page.select === v }"
				ref = 'items'
				@click = 'page.click(v, true)'
				class = 'pointer'
			>{{ mainGame.get.text(i) }}</span>
		</div>
	</main>
</template>
<script setup lang = 'ts'>
	import { reactive, onUnmounted, onBeforeMount } from 'vue';
	import hotkeys from 'hotkeys-js';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	import News from './news.vue';

	const page = reactive({
		time : {
			y : -1,
			year : '',
			month : '',
			day : '',
			hour : '',
			minute : '',
			second : '',
			interval : null as null | number
		},
		select : 0,
		menu : [I18N_KEYS.MENU_SINGLE, I18N_KEYS.MENU_CONENCT, I18N_KEYS.MENU_DECK, I18N_KEYS.MENU_SETTING, I18N_KEYS.MENU_EXIT],
		pointer : new Array(2).fill(-1000),
		click : (v : number, item : boolean = false) : void => {
			if (item && page.select === v) {
				page.to();
				return;
			}
			page.select = v;
		},
		keydown : (event : KeyboardEvent) : void => {
			const len = page.menu.length - 1;
			if (['PageDown', 'ArrowDown'].includes(event.key))
				page.select >= len ? page.select = 0 : page.select ++;
			else if (['PageUp', 'ArrowUp'].includes(event.key))
				page.select <= 0 ? page.select = len : page.select --;
			else if (event.key === 'Enter')
				page.click(page.select, true);
		},
		to : async () : Promise<void> => {
			switch (page.select) {
				case 0:
					break;
				case 1:
					emit('server');
					break;
				case 2:
					emit('deck');
					break;
				case 3:
					emit('setting');
					break;
				case 4:
					await mainGame.exit();
					break;
			}
		}
	});

	onBeforeMount(async () : Promise<void> => {
		hotkeys('down, pagedown', () => {
			const len = page.menu.length - 1;
			page.select = page.select >= len ? 0 : page.select + 1;
		});
		hotkeys('up, pageup', () => {
			const len = page.menu.length - 1;
			page.select = page.select <= 0 ? len : page.select - 1;
		});
		hotkeys('enter', () => {
			page.click(page.select, true);
		});

		const time = () => {
			const now = new Date();
			const year = now.getFullYear().toString();
			const month = (now.getMonth() + 1).toString();
			const day = now.getDate().toString();
			const hour = now.getHours().toString();
			const minute = now.getMinutes().toString();
			const second = now.getSeconds().toString();
			page.time.year = `${year.length > 1 ? '' : '0'}${year}`;
			page.time.month = `${month.length > 1 ? '' : '0'}${month}`;
			page.time.day = `${day.length > 1 ? '' : '0'}${day}`;
			page.time.hour = `${hour.length > 1 ? '' : '0'}${hour}`;
			page.time.minute = `${minute.length > 1 ? '' : '0'}${minute}`;
			page.time.second = `${second.length > 1 ? '' : '0'}${second}`;
		};
		time();
		page.time.interval = setInterval(time, 1000);
	})

	onUnmounted(() => {
		hotkeys.unbind('down, pagedown');
		hotkeys.unbind('up, pageup');
		hotkeys.unbind('enter');
		if (page.time.interval)
			clearInterval(page.time.interval);
	});

	const emit = defineEmits<{
		server : [];
		deck : [];
		setting : [];
	}>();
</script>
<style scoped lang = 'scss'>
	main {
		height: calc(var(--height) * 0.9);
		width: calc(var(--width) * 0.9);
		display: flex;
		color: white;
		font-size: 48px;
		> div {
			width: 50%;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		> div:first-child {
			> div:first-child {
				width: 100%;
				height: 50%;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				text-shadow:
					0 0 5px aqua,
					0 0 10px aqua,
					0 0 20px aqua,
					0 0 40px aqua;
			}
		}
		> div:nth-child(2) {
			justify-content: center;
			span {
				width: 300px;
				position: relative;
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
					transform: translateX(-55px);
				}
			}
		}
	}
</style>