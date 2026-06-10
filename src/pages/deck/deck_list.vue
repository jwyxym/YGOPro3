<template>
	<div class = 'ygopro3__deck'>
		<transition name = 'opacity'>
			<main v-show = 'page.list'>
				<div>
					<div class = 'input'>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.DECK_INPUT)'
							variant = 'outlined'
							v-model = 'input.value'
						/>
						<div>
							<Button
								:content = 'mainGame.get.text(I18N_KEYS.CONFIRM)'
								@click = 'input.confirm'
								:loading = 'input.loading'
							/>
							<Button
								:content = 'mainGame.get.text(I18N_KEYS.DECK_INPUT_BY_PIC)'
								@click = 'input.by_pic'
								:loading = 'input.loading'
							/>
						</div>
					</div>
					<TransitionGroup tag = 'div' name = 'move_left' class = 'no-scrollbar'>
						<h2
							v-for = '(i, v) in list.decks'
							:key = 'i.name'
							:class = "{ 'selected' : list.selected === v }"
							@click = 'list.select(v)'
							class = 'pointer'
						>{{ i.name }}</h2>
					</TransitionGroup>
				</div>
				<TransitionGroup tag = 'div' name = 'opacity'>
					<div v-if = 'list.selected > -1' key = '0' class = 'deck'>
						<span class = 'font-title'>
							{{ list.decks[list.selected].name }}
						</span>
						<div>
							<div class = 'card' v-for = 'card in list.decks[list.selected].main'>
								<img v-lazy = 'mainGame.get.card(card).pic'>
							</div>
						</div>
						<div>
							<div class = 'card' v-for = 'card in list.decks[list.selected].extra'>
								<img v-lazy = 'mainGame.get.card(card).pic'>
							</div>
						</div>
						<div>
							<div class = 'card' v-for = 'card in list.decks[list.selected].side'>
								<img v-lazy = 'mainGame.get.card(card).pic'>
							</div>
						</div>
					</div>
				</TransitionGroup>
				<TransitionGroup tag = 'div' name = 'opacity'>
					<Button
						v-if = 'page.button === 0'
						:content = 'mainGame.get.text(I18N_KEYS.DECK_NEW)'
						:loading = 'input.loading'
						@click = 'list.add()'
						key = '0'
					/>
					<Button
						v-if = 'page.button === 1'
						:content = 'mainGame.get.text(I18N_KEYS.DECK_INIT)'
						:loading = 'input.loading'
						@click = 'page.indeck(list.decks[list.selected])'
						key = '2'
					/>
					<Button
						v-if = 'page.button === 1'
						:content = 'mainGame.get.text(I18N_KEYS.DECK_COPY)'
						@click = 'page.copy(list.decks[list.selected])'
						key = '3'
					/>
					<Button
						v-if = 'page.button === 1'
						:content = 'mainGame.get.text(I18N_KEYS.DECK_DEL)'
						@click = 'list.delete()'
						key = '4'
					/>
					<Button
						v-if = 'page.button === 1'
						:content = 'mainGame.get.text(I18N_KEYS.CLOSE)'
						@click = 'list.unselect'
						key = '5'
					/>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
						:loading = 'input.loading'
						@click = "emit('exit')"
						key = '6'
					/>
				</TransitionGroup>
			</main>
		</transition>
		<transition name = 'opacity'>
			<DeckPage
				v-if = 'page.deck'
				:this_deck = 'page.deck!'
				@update = 'page.update'
				@copy = 'page.copy'
				@exit = 'page.offdeck'
			/>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, onMounted } from 'vue';
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import { open } from '@tauri-apps/plugin-dialog';

	import DeckPage from './deck.vue';
	import Button from '@/pages/ui/button.vue';
	import Input from '@/pages/ui/input.vue';
	import Dialog from '@/pages/ui/dialog';
	import { toast } from '@/pages/toast/toast';

	import Deck from './deck';
	import recognizer from './recognizer';
	import mainGame from '@/script/game';
	import invoke from '@/script/invoke';
	import * as CONSTANT from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';

	const page = reactive({
		list : true,
		button : 0,
		deck : undefined as undefined | Deck,
		copy : async (deck : Deck) : Promise<void> => {
			await writeText(deck.toYGOMobileDeckURL());
			toast.info(mainGame.get.text(I18N_KEYS.DECK_COPY_COMPELETE));
		},
		update : (name : string) : void => {
			if (!page.deck) return;
			page.deck.is_not_new();
			page.deck.set_name(name);
		},
		indeck : async (deck : Deck) : Promise<void> => {
			page.list = false;
			input.clear();
			await mainGame.sleep(200);
			page.deck = deck;
			list.decks.length = 0;
			list.selected = -1;
		},
		offdeck : async () : Promise<void> => {
			if (await Dialog({
				title : mainGame.get.text(I18N_KEYS.DECK_EXIT),
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_EXIT_DECK))) {
				const deck = page.deck;
				page.deck = undefined;
				await mainGame.sleep(200);
				page.list = true;
				await list.load(deck);
			}
		},
	});

	const list = reactive({
		decks : [] as Array<Deck>,
		selected : -1,
		select : async (n : number) => {
			if (list.selected === n)
				page.indeck(list.decks[list.selected]);
			else {
				list.selected = -1;
				page.button = -1;
				input.clear();
				await mainGame.sleep(200, mainGame.load.pic, [list.decks[n]]);
				list.selected = n;
				page.button = 1;
			}
		},
		unselect : async () => {
			list.selected = -1;
			page.button = -1;
			await mainGame.sleep(200);
			page.button = 0;
		},
		load : async (deck ?: Deck) : Promise<void> => {
			const decks = await invoke.deck.get();
			list.decks = decks;
			if (deck)
				list.selected = decks.findIndex(i => i.name === deck.name);
		},
		add : async () => {
			const deck = new Deck({
				main : [],
				side : [],
				extra : [],
				name : ''
			});
			deck.is_new();
			await page.indeck(deck);
		},
		delete : async () : Promise<void> => {
			if (list.selected > -1 && await Dialog({
				title : mainGame.get.text(I18N_KEYS.DECK_DELETE_TITLE),
				message : mainGame.get.text(I18N_KEYS.DECK_DELETE_MESSAGR, list.decks[list.selected].name ?? '')
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_DELETE_DECK)) && await invoke.deck.del(list.decks[list.selected].name!)) {
				toast.info(mainGame.get.text(I18N_KEYS.DELETE_COMPELETE));
				list.decks.splice(list.selected, 1);
				list.selected = -1;
			}
		},
	});

	const input = reactive({
		loading : false,
		value : '',
		confirm : () : void => {
			if (input.value) {
				const deck = input.value.startsWith(CONSTANT.URL.DECK_SHARE) ? Deck.fromYGOMobileDeckURL(input.value) : Deck.fromYdkString(input.value, true);
				deck.main = deck.main.filter(i => mainGame.cards.has(i));
				deck.extra = deck.extra.filter(i => mainGame.cards.has(i));
				deck.side = deck.side.filter(i => mainGame.cards.has(i));
				deck.is_new();
				page.indeck(deck);
			}
			return input.clear();
		},
		by_pic : async () => {
			const file = await open({
				multiple: false,
				directory: false
			});
			if (file) {
				input.loading = true;
				const deck = await recognizer.on(file);
				await page.indeck(deck);
				input.loading = false;
			}
		},
		clear : () : void => {
			input.value = '';
		}
	})

	onMounted(list.load);
	const emit = defineEmits<{ exit : []; }>();

</script>
<style scoped lang = 'scss'>
	.ygopro3__deck {
		height: 100%;
		width: 100%;
		[media = 'mobile'] & {
			:deep(.var-button) {
				transform: scale(160%);
			}
			:deep(.var-input) {
				transform: scale(140%);
				transform-origin: left center;
			}
		}
		> * {
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
		> main {
			position: relative;
			height: calc(var(--height) * 0.9);
			width: calc(var(--width) * 0.9);
			display: flex;
			color: white;
			> div:first-child {
				width: 40%;
				height: 100%;
				overflow-x: hidden;
				display: flex;
				flex-direction: column;
				[media = 'mobile'] & {
					gap: 40px;
				}
				.input {
					margin-top: 10px;
					width: 50%;
					height: 100px;
					display: flex;
					flex-direction: column;
					[media = 'mobile'] & {
						gap: 40px;
					}
					[media = 'pc'] & {
						gap: 10px;
					}
					> div {
						width: 100%;
						display: flex;
						justify-content: center;
						gap: 30%;
					}
				}
				> div:last-child {
					overflow-y: auto;
					[media = 'mobile'] & {
						height: calc(100% - 150px);
					}
					[media = 'pc'] & {
						height: calc(100% - 110px);
					}
					h2 {
						transition: all 0.2s ease;
						[media = 'mobile'] & {
							font-size: 24px;
						}
						[media = 'pc'] & {
							font-size: 18px;
						}
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
			}
			> div:nth-child(2) {
				width: 60%;
				height: 100%;
				position: relative;
				.deck {
					width: 100%;
					overflow: hidden;
					mask: radial-gradient(circle, white 0%, white 20%, transparent 100%);
					-webkit-mask: radial-gradient(circle, white 0%, white 20%, transparent 100%);
					display: grid;
					height: 100%;
					width: 100%;
					span {
						justify-self: center;
						z-index: 1;
						[media = 'mobile'] & {
							font-size: 64px;
						}
						[media = 'pc'] & {
							font-size: 48px;
						}
					}
					.card {
						width: 55px;
						aspect-ratio: 1 / 1.45;
						display: inline-block;
						img {
							width: 100%;
							height: 100%;
						}
					}
				}
			}
			> div:last-child {
				position: absolute;
				right: 0;
				bottom: 0;
				display: flex;
				flex-direction: column;
				[media = 'mobile'] & {
					gap: 25px;
				}
				[media = 'pc'] & {
					gap: 5px;
				}
				.var-button {
					width: 90px;
				}
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