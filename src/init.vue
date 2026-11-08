<template>
	<div class = 'main'>
		<StarrySky
			position = 'fixed'
			:z-index = '-1'
			:layers = '2'
			:density = '1'
			:speed = '2'
		/>
		<Loading
			v-model:loading = 'page.loading'
		/>
		<Toast/>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Deck
				v-if = 'page.show.deck'
				@exit = 'page.select.menu'
			/>
			<Card
				v-if = 'page.show.card'
				@exit = 'page.select.menu'
			/>
			<Duel
				v-if = 'page.show.duel'
				:model = 'page.duel.model'
				@exit = 'page.select.menu'
			/>
			<Setting
				v-if = 'page.show.setting'
				:loading = 'page.loading'
				@exit = 'page.select.menu'
			/>
			<YGOMenu
				v-if = 'page.ready'
				v-show = 'page.show.menu'
				:active = 'page.show.menu'
				@deck = 'page.select.deck'
				@card = 'page.select.card'
				@single = 'page.select.single'
				@server = 'page.select.server'
				@replay = 'page.select.replay'
				@setting = 'page.select.setting'
				@exit = 'page.select.exit'
			/>
		</TransitionGroup>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, onMounted, onUnmounted } from 'vue';

	import YGOMenu from './pages/menu/menu.vue';
	import Deck from './pages/deck/deck_list.vue';
	import Card from './pages/card/card_list.vue';
	import Duel from './pages/duel/connect.vue';
	import Setting from './pages/setting/setting.vue';
	import Loading from './pages/loading/loading.vue';
	import Toast from './pages/toast/toast';
	import dialog from './ui/dialog';

	import mainGame from './script/game';
	import { I18N_KEYS } from './script/language/i18n';
	import landscape from './script/landscape';

	const page = reactive({
		loading : false,
		ready : false,
		duel : {
			model : 0 as 0 | 1 | 2
		},
		show : {
			dialog : false,
			menu : false,
			duel : false,
			deck : false,
			card : false,
			setting : false
		},
		select : {
			busy : false,
			lock : async (f : () => void | Promise<void>) : Promise<void> => {
				if (page.loading || page.select.busy)
					return;
				page.select.busy = true;
				try {
					await f();
				}
				finally {
					page.select.busy = false;
				}
			},
			menu : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.card = false;
				page.show.duel = false;
				page.show.deck = false;
				page.show.setting = false;
				if (!page.show.menu) {
					await mainGame.sleep(600);
					page.show.menu = true;
				}
			}),
			single : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.menu = false;
				await mainGame.sleep(600);
				page.duel.model = 0;
				page.show.duel = true;
			}),
			server : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.menu = false;
				await mainGame.sleep(600);
				page.duel.model = 1;
				page.show.duel = true;
			}),
			replay : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.menu = false;
				await mainGame.sleep(600);
				page.duel.model = 2;
				page.show.duel = true;
			}),
			deck : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.menu = false;
				await mainGame.sleep(600);
				page.show.deck = true;
			}),
			card : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.menu = false;
				await mainGame.sleep(600);
				page.show.card = true;
			}),
			setting : () : Promise<void> => page.select.lock(async () : Promise<void> => {
				page.show.menu = false;
				await mainGame.sleep(600);
				page.show.setting = true;
			}),
			exit : () : Promise<void> => page.select.lock(() : Promise<void> => __WEB__
				? landscape.exit()
				: mainGame.exit())
		}
	});

	onMounted(async () : Promise<void> => {
		if (await mainGame.init()) {
			page.ready = true;
			page.show.menu = true;
			landscape.to();
		}
		else {
			await dialog({
				title : mainGame.get.text(I18N_KEYS.START_TITLE),
				message : mainGame.get.text(I18N_KEYS.START_MESSAGE),
				closeOnClickOverlay : false,
				cancelButton : false
			}, true);
			await mainGame.exit();
		}
	});

	onUnmounted(mainGame.clear);

</script>
<style scoped lang = 'scss'>
	.main {
		position: relative;
		> .ygopro3__loading {
			position: fixed;
			left: 50%;
			top: 50%;
			height: var(--height);
			width: var(--width);
			transform: translate(-50%, -50%) scale(var(--scale));

		}
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
