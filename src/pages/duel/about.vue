<template>
	<div class = 'about ygopro3__duel__about'>
		<div>
			<span v-if = 'card'>
				{{ mainGame.get.text(I18N_KEYS.DECK_RELATED_CARD_TITLE, [mainGame.get.card(card).name]) }}
			</span>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.CLOSE)'
				@click.stop = 'page.close'
			/>
		</div>
		<var-loading :loading = '!page.cards.length' class = 'no-scrollbar'>
			<img
				v-for = '(i, v) in page.cards'
				:key = 'v'
				v-lazy = 'i[1]'
				@click.stop = "emit('click', i[0])"
			/>
		</var-loading>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, watch } from 'vue';
	import PQueue from 'p-queue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Button from '@/pages/ui/button.vue';
	import Search from '@/pages/deck/search';
	const page = reactive({
		cards : [] as Array<[number, string]>,
		close : () => {
			queue.clear();
			emit('update:card', 0);
		}
	});
	const queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});

	const props = defineProps<{
		card : number
	}>();

	const emit = defineEmits<{
		'update:card' : [i : number];
		click : [i : number];
	}>();

	watch(() => props.card, (id : number) => {
		if (id)
			queue.add(async () => {
				page.cards.length = 0;
				const c = mainGame.get.card(id);
				const searcher = new Search()
					.set.cards(Array.from(mainGame.cards).map(i => i[1]))
					.set.id(id)
					.set.setcode(c.setcode)
					.set.desc(c.name);
				const codes : Array<number> = searcher.about().map(i => i.id);
				page.cards = await mainGame.load.pic(codes);
			});
	}, { immediate : true });
</script>
<style scoped lang = 'scss'>
	.about {
		height: calc(var(--height) * 0.8);
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: white;
		[media = 'mobile'] & {
			width: calc(var(--width) * 0.75);
		}
		[media = 'pc'] & {
			width: calc(var(--width) * 0.55);
		}
		> div:first-child {
			width: 98%;
			display: flex;
			align-items: center;
			[media = 'mobile'] & {
				height: 90px;
			}
			[media = 'pc'] & {
				height: 50px;
			}
			span {
				width: calc(100% - 80px);
				[media = 'mobile'] & {
					font-size: 24px;
				}
			}
			.var-button {
				width: 80px;
				[media = 'mobile'] & {
					transform: scale(140%);
				}
			}
		}
		> div:last-child {
			width: 95%;
			[media = 'mobile'] & {
				height: calc(100% - 90px);
			}
			[media = 'pc'] & {
				height: calc(100% - 50px);
			}
			display: flex;
			flex-wrap: wrap;
			overflow-y: auto;
			transform: translateX(2.5px);
			border: 1px white solid;
			img {
				width: 10%;
				aspect-ratio: 1 / 1.45;
			}
		}
	}
</style>