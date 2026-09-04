<template>
	<div
		class = 'card_list'
		:style = "{ '--width' : `${width}px`, '--height' : `${height}px` }"
	>
		<div v-if = 'page.about' class = 'about__name'>
			<span>{{ mainGame.get.text(I18N_KEYS.DECK_RELATED_CARD_TITLE, [page.about.name]) }}</span>
			<Button
				:content = 'mainGame.get.text(I18N_KEYS.CLOSE)'
				@click = 'search.search'
			/>
		</div>
		<div v-else class = 'search__input'>
			<Input
				variant = 'outlined'
				:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_NAME)'
				v-model = 'search.desc'
				@enter = 'search.search'
				@clear = 'search.search'
			/>
			<Button
				icon_name = 'search'
				@click = 'search.search'
				:loading = 'page.loading'
			/>
		</div>
		<div
			ref = 'list'
			class = 'no-scrollbar'
			@scroll = 'page.scroll'
			@dragstart = "emit('dragstart', $event)"
			@dragend = "emit('dragend', $event)"
		/>
		<div>
			<Button :content = 'mainGame.get.text(I18N_KEYS.DECK_BTN_SEARCH)' @click = "emit('search')"/>
			<Button :content = 'mainGame.get.text(I18N_KEYS.DECK_SETTING_SAVE)' @click = "emit('save')"/>
			<Button :content = 'mainGame.get.text(I18N_KEYS.EXIT)' @click = "emit('exit')"/>
			<p @click = 'page.back' class = 'pointer'><span>&#9650;</span></p>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
	import Mark from 'mark.js';

	import mainGame from '@/script/game';
	import Card from '@/script/card';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS, REG } from '@/script/constant';
	import LFList from '@/script/lflist';
	import Search from '@/pages/deck/search';
	import Input from '@/ui/input.vue';
	import Button from '@/ui/button.vue';
	import * as card from './card';

	let mark : InstanceType<typeof Mark> | undefined;
	const list = ref<HTMLDivElement | null>(null);

	const page = reactive({
		about : undefined as undefined | Card,
		result : [] as Array<Card>,
		index : 0,
		loading : false,
		scroll : async function (event : Event) : Promise<void> {
			if (this.loading || this.index >= this.result.length)
				return;
			const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
			if (scrollHeight - scrollTop - clientHeight > 20)
				return;
			this.loading = true;
			await this.load();
			this.loading = false;
		},
		load : async function () : Promise<void> {
			if (this.index >= this.result.length)
				return;
			const from = this.index;
			const to = this.index + 100;
			const cards = this.result.slice(from, to)
			await mainGame.load.pic(cards.map(i => i.id));
			this.index = Math.min(to, this.result.length);
			card.append_list(
				list.value!,
				cards,
				(i : HTMLDivElement) => {
					i.addEventListener('contextmenu', (e) => {
						e.preventDefault();
						emit('add', i.dataset.id!)
					});
					i.addEventListener('click', (e) => {
						e.preventDefault();
						emit('card', i.dataset.id!)
					});
				}
			);
		},
		back : () => {
			if (list.value)
				list.value.scrollTop = 0;
		}
	});

	const search = reactive({
		desc : '',
		search : async () : Promise<void> => {
			page.about = undefined;
			page.index = 0;
			page.loading = true;
			card.clear_list(list.value!);
			const searcher = new Search()
				.set.cards(Array.from(mainGame.cards).map(i => i[1]))
				.set.ot(props.info.ot)
				.set.type(props.info.type)
				.set.race(props.info.race)
				.set.attribute(props.info.attribute)
				.set.category(props.info.category)
				.set.link(props.info.link)
				.set.lflist(props.info.lflist)
				.set.forbidden(props.info.forbidden)
				.set.lv(props.info.lv)
				.set.scale(props.info.scale)
				.set.atk(props.info.atk)
				.set.def(props.info.def)
				.set.desc(search.desc)
				.set.and_or(props.switchs);
			page.result = searcher.search();
			await page.load();
			page.loading = false;
			const desc = searcher.desc ?? [];
			mark?.unmark({
				done : () => desc.length ? mark?.mark(desc) : true
			});
			emit('update:desc', desc);
		},
		about : async (id : number) => {
			if (!id) return;
			card.clear_list(list.value!);
			const c = mainGame.get.card(id);
			page.about = c;
			page.index = 0;
			page.loading = true;
			const desc = [c.name];
			for (const i of c.desc.matchAll(REG.KEY_WORDS))
				desc.push(i[1]);
			const searcher = new Search()
				.set.cards(Array.from(mainGame.cards).map(i => i[1]))
				.set.id(c.id)
				.set.setcode(c.setcode)
				.set.desc(desc.join(mainGame.get.system(KEYS.SETTING_SEARCH_SPLIT) as string));
			page.result = searcher.about();
			await page.load();
			page.loading = false;
			mark?.unmark();
			emit('update:desc', []);
		}
	});

	const emit = defineEmits<{
		card : [card : number | string];
		save : [];
		exit : [];
		dragstart : [e : DragEvent];
		dragend : [e : DragEvent];
		add : [code : number | string];
		search : [];
		'update:desc' : [desc : Array<string>];
	}>();

	const props = defineProps<{
		width : number;
		height : number;
		lflist ?: LFList;
		info : {
			ot : Array<number>;
			type : [Array<number>, Array<number>, Array<number>, Array<number>];
			attribute : Array<number>;
			race : Array<number>;
			category : Array<number>;
			link : Array<number>;
			lflist : string;
			forbidden : string;
			lv : string;
			atk : string;
			def : string;
			scale : string;
		};
		switchs : {
			'type' : boolean;
			'category' : boolean;
			'link' : boolean;
		};
	}>();

	watch(() => props.lflist, (n) => card.count_list(list.value!, n));

	onMounted(async () => {
		await search.search();
		if (list.value)
			mark = new Mark(list.value);
	});

	onUnmounted(() => {
		mark = undefined;
	});

	defineExpose<{
		about : (id : number) => Promise<void>;
		search : () => Promise<void>;
	}>({
		about : search.about,
		search : search.search
	});
</script>
<style lang = 'scss' scoped>
	$head-height: 60px;
	$foot-height: 30px;
	.card_list {
		width: var(--width);
		height: var(--height);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		display: flex;
		flex-direction: column;
		> div {
			margin: 10px;
			width: calc(100% - 20px);
		}
		> div:first-child {
			height: $head-height;
			display: flex;
			align-items: center;
			&.search__input {
				[media = 'mobile'] & {
					gap: 125px;
				}
				[media = 'pc'] & {
					gap: 10px;
				}
				.var-input {
					[media = 'mobile'] & {
						width: 55%;
					}
					[media = 'pc'] & {
						width: 80%;
					}
				}
			}
			&.about__name {
				justify-content: space-between;
				[media = 'mobile'] & {
					width: calc(95% - 20px);
				}
				span {
					font-weight: bold;
					white-space: nowrap;
					max-width: calc(100% - 100px);
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}
		}
		> div:nth-child(2) {
			height: calc(100% - $head-height - $foot-height);
			width: calc(100% - 10px);
			overflow-y: auto;
			overflow-x: hidden;
			scroll-behavior: smooth;
		}
		> div:nth-child(3) {
			position: relative;
			height: $foot-height;
			display: flex;
			[media = 'mobile'] & {
				gap: 50px;
				.var-button {
					transform-origin: left center;
				}
			}
			[media = 'pc'] & {
				gap: 5px;
			}
			> p {
				position: absolute;
				border: 1px solid white;
				border-radius: 4px;
				height: 30px;
				width: 30px;
				right: 5px;
				display: flex;
				justify-content: center;
				align-items: center;
				[media = 'mobile'] & {
					transform: scale(140%) translateY(-10px);
				}
				[media = 'pc'] & {
					transform: translateY(- $foot-height);
				}
			}
		}
	}
</style>
