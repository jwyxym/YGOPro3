<template>
	<div class = 'single'>
		<TransitionGroup tag = 'div' name = 'move_left' class = 'no-scrollbar'>
			<h2
				v-for = '(i, v) in page.list'
				:key = 'i[1]'
				:class = "{ 'selected' : page.selected === v }"
				@click = 'page.select(v)'
				class = 'pointer'
			>{{ i[0] }}</h2>
		</TransitionGroup>
		<transition name = 'opacity'>
			<var-form
				@submit = 'page.connect'
				v-show = 'page.selected > - 1'
			>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SERVER_NAME)'
				>
					<template #extra>
						<Input
							v-model = 'page.name'
						/>
					</template>
				</var-cell>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SINGLE_LP)'
				>
					<template #extra>
						<Input
							type = 'number'
							v-model = 'page.start_lp'
						/>
					</template>
				</var-cell>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SINGLE_HAND)'
				>
					<template #extra>
						<var-counter
							:min = '0'
							:max = '999'
							v-model = 'page.start_hand'
						/>
					</template>
				</var-cell>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SINGLE_DRAW)'
				>
					<template #extra>
						<var-counter
							:min = '0'
							:max = '999'
							v-model = 'page.draw'
						/>
					</template>
				</var-cell>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SINGLE_RPS)'
				>
					<template #extra>
						<var-checkbox v-model = 'page.rps'/>
					</template>
				</var-cell>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SINGLE_NOSHUFFLE)'
				>
					<template #extra>
						<var-checkbox v-model = 'page.no_shuffle'/>
					</template>
				</var-cell>
				<var-cell
					:title = 'mainGame.get.text(I18N_KEYS.SINGLE_NOCHK)'
				>
					<template #extra>
						<var-checkbox v-model = 'page.no_chk'/>
					</template>
				</var-cell>
				<div
					class = 'select'
					:class = "{ 'unshow' : page.list[page.selected]?.[1] !== 'Lucky' }"
				>
					<Select
						name = 'deck'
						v-model = 'page.deck'
						:rules = 'page.rule'
						:clearable = 'true'
					/>
				</div>
				<div>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.SERVER_START_DUEL)'
						native-type = 'submit'
					/>
				</div>
			</var-form>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onUnmounted, reactive } from 'vue';
	import hotkeys from 'hotkeys-js';

	import mainGame from '@/script/game';
	import invoke from '@/script/invoke';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';

	import Input from '@/pages/ui/input.vue';
	import Button from '@/pages/ui/button.vue';
	import Select from '@/pages/ui/select.vue';

	import Deck from '@/pages/deck/deck';

	const page = reactive({
		deck : undefined as undefined | Deck,
		selected : -1,
		name : mainGame.get.system(KEYS.SETTING_SERVER_PLAYER_NAME) as string,
		list : [] as Array<[string, string, string]>,
		start_lp : 8000,
		start_hand : 5,
		draw : 1,
		rps : false,
		no_shuffle : false,
		no_chk : false,
		select : (v : number) => page.selected = page.selected === v ? -1 : v,
		rule : () => {
			const selected = page.list[page.selected];
			if (selected?.[1] === 'Lucky' && !page.deck)
				return mainGame.get.text(I18N_KEYS.SERVER_DECK_ERROR)
			return true;
		},
		connect : () => {
			const selected = page.list[page.selected];
			if (!selected || (selected[1] === 'Lucky' && !page.deck)) return;
			emit('connect', {
				name : page.name,
				args : [
					`7911 -1 5 0 F ${page.no_chk ? 'T' : 'F'} ${page.no_shuffle ? 'T' : 'F'} ${page.start_lp} ${page.start_hand} ${page.draw} 0 0`,
					`Name=${selected[0]} Deck=${selected[1]} Dialog=${selected[2]}${page.rps ? ' Hand=1' : ''}`
				],
				deck : selected[1] === 'Lucky' ? page.deck?.name ?? '' : ''
			});
		}
	});

	onBeforeMount(async () : Promise<void> => {
		page.list = await invoke.bot.list();
		hotkeys('down, pagedown', () => {
			const len = page.list.length - 1;
			page.selected = page.selected >= len ? 0 : page.selected + 1;
		});
		hotkeys('up, pageup', () => {
			const len = page.list.length - 1;
			page.selected = page.selected <= 0 ? len : page.selected - 1;
		});
	});

	onUnmounted(() => {
		hotkeys.unbind('down, pagedown');
		hotkeys.unbind('up, pageup');
	});

	const emit = defineEmits<{
		connect : [server : {
			name : string;
			args : [string, string];
			deck : string;
		}];
	}>();
</script>
<style scoped lang = 'scss'>
	.single {
		display: flex;
		height: calc(var(--height) * 0.8);
		width: calc(var(--width) * 0.8);
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.2);
		color: white;
		> div, > form {
			height: 100%;
			width: calc(50% - 2px);
			border: 1px solid white;
		}
		> div {
			overflow-y: auto;
			h2 {
				font-size: 18px;
				transition: all 0.2s ease;
				transform: translateX(10px);
			}
			.selected {
				text-shadow:
					0 0 5px aqua,
					0 0 10px aqua,
					0 0 20px aqua,
					0 0 40px aqua;
				transform: translateX(10px);
			}
		}
		> form {
			display: flex;
			flex-direction: column;
			align-items: center;
			> * {
				transition: opacity 0.2s ease;
			}
			.var-cell {
				width: 80%;
				:deep(.var-cell__extra) {
					height: 40px;
				}
				:deep(.var-input) {
					width: 200px;
				}
			}
			.unshow {
				opacity: 0;
			}
			.select {
				width: 80%;
				height: 80px;
				display: flex;
				justify-content: center;
				align-items: center;
				.var-select {
					width: 80%;
				}
			}
			> div:last-child {
				width: 80%;
				height: 60px;
				display: flex;
				justify-content: flex-end;
				align-items: center;
			}
		}
	}
	.move_left {
		&-enter-active,
		&-leave-active {
			transition: transform 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translateX(- var(--width));
		}

		&-enter-to,
		&-leave-from {
			transform: translateX(0);
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