<template>
	<main class = 'font-menu ygopro3__menu'>
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
				@click = 'page.click(v)'
				@mouseenter = 'page.mouseenter(v)'
				@mouseleave = 'page.mouseleave'
				class = 'pointer'
			>{{ mainGame.get.text(i) }}</span>
		</div>
	</main>
</template>
<script setup lang = 'ts'>
	import { reactive, onUnmounted, onBeforeMount } from 'vue';

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
		select : - 1,
		menu : [
			I18N_KEYS.MENU_SINGLE,
			I18N_KEYS.MENU_CONENCT,
			I18N_KEYS.MENU_REPLAY,
			I18N_KEYS.MENU_DECK,
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
				case 0:
					emit('single');
					break;
				case 1:
					emit('server');
					break;
				case 2:
					emit('replay');
					break;
				case 3:
					emit('deck');
					break;
				case 4:
					emit('setting');
					break;
				case 5:
					await mainGame.exit();
					break;
			}
		}
	});

	onBeforeMount(async () : Promise<void> => {
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
		if (page.time.interval)
			clearInterval(page.time.interval);
	});

	const emit = defineEmits<{
		single : [];
		server : [];
		replay : [];
		deck : [];
		setting : [];
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