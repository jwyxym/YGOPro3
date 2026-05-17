<template>
	<div class = 'main'>
		<starry-sky :stars-count = '1500' :distance = '800' id = 'back'/>
		<Voice v-if = 'page.show.voice'/>
		<Loading
			@loading = '(n) => page.loading = n'
		/>
		<Toast/>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Deck
				v-if = 'page.show.deck'
				@exit = 'page.select.menu'
			/>
			<Duel
				v-if = 'page.show.single'
				:model = '0'
				@exit = 'page.select.menu'
			/>
			<Duel
				v-if = 'page.show.server'
				:model = '1'
				@exit = 'page.select.menu'
			/>
			<Setting
				v-if = 'page.show.setting'
				:loading = 'page.loading'
				@exit = 'page.select.menu'
			/>
			<YGOMenu
				v-if = 'page.show.menu'
				@deck = 'page.select.deck'
				@server = 'page.select.server'
				@setting = 'page.select.setting'
			/>
		</TransitionGroup>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, onBeforeMount, onMounted, onUnmounted } from 'vue';

	import YGOMenu from './pages/menu/menu.vue';
	import Deck from './pages/deck/deck_list.vue';
	import Duel from './pages/duel/connect.vue';
	import Setting from './pages/setting/setting.vue';
	import Loading from './pages/loading/loading.vue';
	import Toast from './pages/toast/toast';
	import Voice from './pages/voice/voice';
	import dialog from './pages/ui/dialog';

	import mainGame from './script/game';
	import { I18N_KEYS } from './script/language/i18n';

	const page = reactive({
		loading : false,
		show : {
			voice : false,
			dialog : false,
			menu : false,
			server : false,
			single : false,
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
				if (page.loading) {
					return;
				}
				page.show.menu = false;
				setTimeout(() => {
					page.show.server = true;
				}, 600);
			},
			deck : () : void => {
				if (page.loading) {
					return;
				}
				page.show.menu = false;
				setTimeout(() => {
					page.show.deck = true;
				}, 600);
			},
			setting : () : void => {
				page.show.menu = false;
				setTimeout(() => {
					page.show.setting = true;
				}, 600);
			}
		}
	});

	onBeforeMount(async () : Promise<void> => {
		if (!await mainGame.init()) {
			await dialog({
				title : mainGame.get.text(I18N_KEYS.START_TITLE),
				message : mainGame.get.text(I18N_KEYS.START_MESSAGE),
				closeOnClickOverlay : false,
				cancelButton : false
			}, true);
			await mainGame.exit();
		}
		page.show.voice = true;
		page.show.menu = true;
	});

	onMounted(async () => {
	});

	onUnmounted(mainGame.clear);

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
	@use './init.scss';
</style>