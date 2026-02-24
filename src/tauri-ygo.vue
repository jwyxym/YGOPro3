<template>
	<div class = 'main' @contextmenu = 'page.contextmenu'>
		<starry-sky :stars-count = '1500' :distance = '800' id = 'back'/>
		<Voice v-if = 'page.show.voice'></Voice>
		<Loading/>
		<Toast/>
		<div>
			<transition name = 'opacity'>
				<Deck
					v-if = 'page.show.deck'
					@exit = 'page.select.menu'
				/>
			</transition>
			<transition name = 'opacity'>
				<Duel
					v-if = 'page.show.server'
					@exit = 'page.select.menu'
				/>
			</transition>
			<Setting
				v-if = 'page.show.setting'
				:select = 'page.select'
			/>
			<transition name = 'opacity'>
				<YGOMenu
					v-if = 'page.show.menu'
					@deck = 'page.select.deck'
					@server = 'page.select.server'
					@setting = 'page.select.setting'
				/>
			</transition>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, onBeforeMount, onMounted } from 'vue';

	import YGOMenu from './pages/menu/menu.vue';
	import Deck from './pages/deck/deck_list.vue';
	import Duel from './pages/duel/duel.vue';
	import Setting from './pages/setting/setting.vue';
	import Loading from './pages/loading/loading.vue';
	import Voice from './pages/voice/voice.vue';
	import Toast from './pages/toast/toast.vue';

	import mainGame from './script/game';
	import fs from './script/fs';
	import { I18N_KEYS } from './script/language/i18n';
	import voice from './pages/voice/voice';
	import Dialog from './pages/ui/dialog';
	import { FILES } from './script/constant';

	const page = reactive({
		show : {
			voice : false,
			dialog : false,
			menu : false,
			server : false,
			deck : false,
			setting : false
		},
		select : {
			menu : () : void => {
				page.show.server = false;
				page.show.deck = false;
				page.show.setting = false;
				if (!page.show.menu)
					setTimeout(() => {
						page.show.menu = true;
					}, 600);
			},
			server : () : void => {
				page.show.menu = false;
				setTimeout(() => {
					page.show.server = true;
				}, 600);
			},
			deck : () : void => {
				page.show.menu = false;
				setTimeout(() => {
					page.show.deck = true;
				}, 600);
			},
			setting : () : void => {
				page.show.setting = true;
			}
		},
		loading : {
			progress : 0,
			start : 0
		},
		contextmenu : (event : MouseEvent) : void => {
			if (!import.meta.env.DEV) event.preventDefault();
		}
	});

	onBeforeMount(async () : Promise<void> => {
		// const on = async (chk : boolean = true) : Promise<void> => {
		// 	await mainGame.init(chk);
		// 	setTimeout(() => {
		// 		page.loading.start = 0;
		// 		page.loading.progress = 0;
		// 	}, 500);
		// 	page.show.menu = true;
		// 	page.show.voice = true;
		// }
		// const download = async () : Promise<void> => {
		// 	if (await fs.init()) {
		// 		page.loading.start = 0;
		// 		page.loading.progress = 0;
		// 		await on(false);
		// 	} else {
		// 		await dialog();
		// 	}
		// }
		// const dialog = async () : Promise<void> => {
		// 	await Dialog({
		// 		title : mainGame.get.text(I18N_KEYS.START_TITLE),
		// 		message : mainGame.get.text(I18N_KEYS.START_MESSAGE),
		// 		onConfirm : download,
		// 		onCancel : mainGame.exit,
		// 		closeOnClickOverlay : false
		// 	}, true)
		// };
		// await mainGame.chk.file() ? await on() : await dialog();
		// voice.play(FILES.BACK_BGM);
	});

	onMounted(async () => {
	});

</script>
<style scoped lang = 'scss'> 
	.main {
		position: relative;
		> div:last-child {
			position: fixed;
			left: 50%;
			top: 50%;
			height: var(--height);
			width: var(--width);
			transform: translate(-50%, -50%) scale(var(--scale));
			display: flex;
			justify-content: center;
			align-items: center;
		}
		#back {
			background: linear-gradient(#1c1a2e, #2f2434);
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
<style lang = 'scss'>
	.var-icon, .cursor {
		&:hover {
			cursor: pointer;
		}
	}
	.dialog, .var-menu-option {
		color: white !important;
		border: 1px solid white;
	}
	.var-divider {
		color: white !important;
	}
	.var-back-top {
		background: none !important;
		button {
			background: none !important;
		}
	}
	.var-card {
		background-color: transparent !important;
	}
	.var-button {
		height: 32px !important;
		overflow: hidden;
		svg {
			width: 30px;
			height: 30px;
		}
	}
	.var-menu-select--scrollable, .var-select__scroller, .ConversationBlock {
		&::-webkit-scrollbar {
			display: none;
		}
	}
	.readonly {
		--checkbox-unchecked-color: #555 !important;
		color: #555 !important;
	}
	.font-title {
		font-family: 'TITLE' !important;
	}
	.font-menu {
		font-family: 'MENU' !important;
	}
	.var-picker__picked {
		border: 1px solid white !important;
	}
	.no-scrollbar {
		&::-webkit-scrollbar {
			display: none;
		}
	}
	.pointer {
		&:hover {
			cursor: pointer;
		}
	}
	.var-menu__menu {
		transform: scale(var(--scale));
	}
	:root {
		--picker-mask-background-image: transparent !important;
		--picker-background: transparent !important;
		--result-background: transparent !important;
		--card-background: transparent !important;
		--dialog-background: transparent !important;
		--popup-content-background-color: transparent !important;
		--tabs-background: transparent !important;
		--select-scroller-background: rgba(0, 0, 0, 0.5) !important;
		--menu-select-menu-background-color: rgba(0, 0, 0, 0.5) !important;
		--dialog-message-color: white !important;
		--dialog-title-color: white !important;
		--list-loading-color: white !important;
		--list-finished-color: white !important;
		--list-error-color: white !important;
		--checkbox-text-color: white !important;
		--menu-option-text-color: white !important;
		--option-text-color: white !important;
		--cell-color: white !important;
		--divider-color: white !important;
		--checkbox-unchecked-color: white !important;
		--cell-border-color: white !important;
		--card-title-color: white !important;
		--card-outline-color: white !important;
		--card-subtitle-color: white !important;
		--card-description-color: white !important;
		--picker-option-text-color: white !important;
		--picker-title-text-color: white !important;
		--picker-cancel-button-text-color: white !important;
		--picker-picked-border:	5px solid white;
		--cell-padding: 1vh 20px !important;
		--field-decorator-line-size: 0.5px !important;
		user-select: none;
	}
	body {
		overflow: hidden;
	}
</style>