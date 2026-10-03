<template>
	<div class = 'ygopro3__card'>
		<transition name = 'opacity'>
			<main v-show = 'list.cards'>
				<div>
					<div class = 'input'>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_NAME)'
							variant = 'outlined'
							@enter = 'input.confirm'
							v-model = 'input.value'
						/>
						<Button
							:content = 'mainGame.get.text(I18N_KEYS.CONFIRM)'
							@click = 'input.confirm'
							:loading = 'input.loading'
						/>
					</div>
					<RecycleScroller
						class = 'card-list no-scrollbar'
						key-field = 'id'
						:items = 'list.cards'
						:item-size = 'list.size'
					>
						<template v-slot = '{ item }'>
							<div class = 'item'>
								<h2
									:class = "{ 'selected' : list.selected === item }"
									@click = 'list.select(item)'
									class = 'pointer'
								>
									{{ item.name }}
								</h2>
							</div>
						</template>
					</RecycleScroller>
				</div>
				<transition name = 'opacity'>
					<div v-if = 'list.selected' class = 'info'>
						<Card_Info
							:card = 'list.selected'
						/>
					</div>
				</transition>
				<div class = 'button'>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.DECK_BTN_SEARCH)'
						@click = 'search.show = true'
					/>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.EXIT)'
						:loading = 'input.loading'
						@click = "emit('exit')"
						key = '6'
					/>
				</div>
			</main>
		</transition>
		<transition name = 'opacity'>
			<Searcher
				v-if = 'search.show'
				v-model:ot = 'search.info.ot'
				v-model:type = 'search.info.type'
				v-model:attribute = 'search.info.attribute'
				v-model:race = 'search.info.race'
				v-model:category = 'search.info.category'
				v-model:link = 'search.info.link'
				v-model:lflist = 'search.info.lflist'
				v-model:forbidden = 'search.info.forbidden'
				v-model:lv = 'search.info.lv'
				v-model:atk = 'search.info.atk'
				v-model:def = 'search.info.def'
				v-model:scale = 'search.info.scale'
				v-model:desc = 'input.value'
				v-model:type-switch = 'search.switchs.type'
				v-model:category-switch = 'search.switchs.category'
				v-model:link-switch = 'search.switchs.link'
				@search = 'input.confirm'
				@clear = 'search.clear'
				@close = 'search.show = false'
			/>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { computed, reactive, onMounted, nextTick } from 'vue';
	import { RecycleScroller } from 'vue-virtual-scroller';

	import Button from '@/ui/button.vue';
	import Input from '@/ui/input.vue';
	import Searcher from '@/pages/deck/searcher.vue';

	import mainGame from '@/script/game';
	import GLOBAL from '@/script/scale';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Card from '@/script/card';
	import { KEYS } from '@/script/constant';
	import Search from '@/pages/deck/search';


	import Card_Info from './card_info.vue';

	const list = reactive({
		cards : [] as Array<Card>,
		selected : undefined as undefined | Card,
		size : computed(() => GLOBAL.SCALE < 0.6 ? 64 : 48),
		select : async function (n : Card) {
			if (this.selected === n) {
				list.selected = undefined;
			} else {
				if (this.selected) {
					this.selected = undefined;
					await mainGame.sleep(200, mainGame.load.pic, [[n.id]]);
				}
				this.selected = n;
			}
		}
	});

	const search = reactive({
		show : false,
		info : {
			ot : [] as Array<number>,
			type : [[], [], [], []] as [Array<number>, Array<number>, Array<number>, Array<number>],
			attribute : [] as Array<number>,
			race : [] as Array<number>,
			category : [] as Array<number>,
			link : [] as Array<number>,
			lflist : mainGame.lflist.keys().next().value ?? KEYS.NA,
			forbidden : '',
			lv : '',
			atk : '',
			def : '',
			scale : ''
		},
		switchs : { type : false, category : false, link : false },
		clear : () : void => {
			search.info.ot.length = 0;
			search.info.type.forEach(i => i.length = 0);
			search.info.attribute.length = 0;
			search.info.race.length = 0;
			search.info.category.length = 0;
			search.info.link.length = 0;
			search.info.lflist = '';
			search.info.forbidden = '';
			search.info.lv = '';
			search.info.atk = '';
			search.info.def = '';
			search.info.scale = '';
			input.clear();
		}
	});

	const input = reactive({
		loading : false,
		value : '',
		confirm : async () : Promise<void> => {
			if (input.loading) return;
			input.loading = true;
			try {
				const searcher = new Search()
					.set.cards(Array.from(mainGame.cards.values()))
					.set.ot(search.info.ot)
					.set.type(search.info.type)
					.set.race(search.info.race)
					.set.attribute(search.info.attribute)
					.set.category(search.info.category)
					.set.link(search.info.link)
					.set.lflist(search.info.lflist)
					.set.forbidden(search.info.forbidden)
					.set.lv(search.info.lv)
					.set.scale(search.info.scale)
					.set.atk(search.info.atk)
					.set.def(search.info.def)
					.set.desc(input.value)
					.set.and_or(search.switchs);
				list.cards = searcher.search();
				await nextTick();
			} finally {
				input.loading = false;
			}
		},
		clear : () : void => {
			input.value = '';
		}
	});

	onMounted(input.confirm);
	const emit = defineEmits<{ exit : []; }>();

</script>
<style scoped lang = 'scss'>
	.ygopro3__card {
		height: 100%;
		width: 100%;
		[media = 'mobile'] & > main {
			:deep(.var-button) {
				transform: scale(140%);
				transform-origin: left top;
			}
			:deep(.var-input) {
				transform: scale(140%);
				transform-origin: left top;
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
					height: 100px;
					margin-top: 10px;
					width: 100%;
					display: flex;
					[media = 'mobile'] & {
						flex-direction: column;
						gap: 30px;
						.var-button {
							width: 10%;
						}
						.var-input {
							width: calc(60%);
						}
					}
					[media = 'pc'] & {
						gap: 10px;
						align-items: center;
						.var-input {
							width: calc(75% - 10px);
						}
					}
				}
				.card-list {
					width: 100%;
					overflow-y: auto;
					[media = 'mobile'] & {
						height: calc(100% - 150px);
					}
					[media = 'pc'] & {
						height: calc(100% - 110px);
					}
					.item {
						width: 100%;
						[media = 'mobile'] & {
							height: 64px;
						}
						[media = 'pc'] & {
							height: 48px;
						}
						> h2 {
							width: 100%;
							margin: 0;
							overflow: hidden;
							text-overflow: ellipsis;
							transition: all 0.2s ease;
							white-space: nowrap;
							[media = 'mobile'] & {
								font-size: 24px;
								line-height: 64px;
							}
							[media = 'pc'] & {
								font-size: 18px;
								line-height: 48px;
							}
						}
						.selected {
							text-shadow:
								0 0 5px aqua,
								0 0 10px aqua;
							transform: translateX(10px);
						}
					}
				}
			}
			.info {
				position: relative;
				width: 60%;
				height: calc(100% - 50px);
			}
			.button {
				display: flex;
				flex-direction: column;
				gap: 10px;
				[media = 'mobile'] & {
					gap: 50px;
				}
				position: absolute;
				right: 0;
				bottom: 0;
				.var-button {
					width: 90px;
				}
			}
		}
		> .ygopro3__deck__search {
			position: absolute;
			z-index: 1;
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