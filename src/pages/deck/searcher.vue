<template>
	<main
		:style = "{ '--width' : `${width}px`, '--height' : `${height}px` }"
	>
		<div>
			<Input
				variant = 'outlined'
				:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_NAME)'
				v-model = 'search.info.desc'
			/>
			<Button icon_name = 'search' @click = 'search.search' :loading = 'page.loading'/>
		</div>
		<div class = 'no-scrollbar' @scroll = 'page.load_on' ref = 'list'>
			<var-list
				:finished = 'page.finished'
				v-model:loading = 'page.loading'
				@load = 'page.load'
				:immediate-check = 'false'
				:style = "{
					'--height' : `${page.size.height + 2}px`,
					'--width' : `${page.size.width + 5}px`,
				}"
				class = 'list'
			>
				<div
					v-for = 'i in page.list'
					:key = 'i.pic.key'
					:id = 'i.pic.key'
				>
					<Pic
						:i = 'i.pic'
						:hover = 'page.card === i.pic'
						:count = '10'
						:size = 'page.size'
						:lflist = 'search.info.lflist ? mainGame.get.lflist(search.info.lflist) : undefined'
						ref = 'cards'
						@contextmenu.prevent = "emit('add', i.pic.code)"
					/>
					<div>
						<span>{{ i.card.name }}</span>
						<br>
						<span>{{ i.card.id }}</span>
					</div>
				</div>
			</var-list>
		</div>
		<div>
			<Button :content = 'mainGame.get.text(I18N_KEYS.DECK_BTN_SEARCH)' @click = 'search.on'/>
			<Button :content = 'mainGame.get.text(I18N_KEYS.DECK_BTN_SETTING)' @click = 'setting.on'/>
			<Button :content = 'mainGame.get.text(I18N_KEYS.EXIT)' @click = "emit('exit')"/>
			<p @click = 'page.back' class = 'pointer'><span>&#9650;</span></p>
		</div>
		<div
			class = 'search no-scrollbar'
			:style = "{ '--x' : search.x }"
			ref = 'search_div'
		>
			<div class = 'lflist'>
				<Select
					name = 'lflist'
					v-model = 'search.info.lflist'
				/>
				<Input
					:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_FORBIDDEN)'
					:rules = 'search.rule.number'
					v-model = 'search.info.forbidden'
				/>
			</div>
			<div
				class = 'select'
				v-for = "j in [
					{ span : I18N_KEYS.CARD_INFO_OT, results : search.info.ot, cards : search.list.ot, key : KEYS.OT, strings : mainGame.get.strings.ot, class : 'ot' },
					{ span : I18N_KEYS.CARD_INFO_TYPE, results : search.info.type[0], cards : search.list.card, key : KEYS.TYPE, strings : mainGame.get.strings.type, value : (i : number) => i - ((i & 0x3) === i ? 0 : (i & 0x3)) },
					{ span : I18N_KEYS.CARD_INFO_SPELL_TRAP_TYPE,  results : search.info.type[1], cards : search.list.spell, key : KEYS.TYPE, strings : mainGame.get.strings.type, value : (i : number) => i - ((i & 0x3) === i ? 0 : (i & 0x3)) },
					{ span : I18N_KEYS.CARD_INFO_MONSTER_TYPE,  results : search.info.type[2], cards : search.list.monster, key : KEYS.TYPE, strings : mainGame.get.strings.type, value : (i : number) => i - ((i & 0x3) === i ? 0 : (i & 0x3)), switchs : 'type' },
					{ span : I18N_KEYS.CARD_INFO_EXCEPT_TYPE,  results : search.info.type[3], cards : search.list.except, key : KEYS.TYPE, strings : mainGame.get.strings.type, value : (i : number) => i - ((i & 0x3) === i ? 0 : (i & 0x3)) },
					{ span : I18N_KEYS.CARD_INFO_ATTRIBUTE, results : search.info.attribute, cards : search.list.attribute, key : KEYS.ATTRIBUTE, strings : mainGame.get.strings.attribute },
					{ span : I18N_KEYS.CARD_INFO_RACE, results : search.info.race, cards : search.list.race, key : KEYS.RACE, strings : mainGame.get.strings.race },
					{ span : I18N_KEYS.CARD_INFO_CATEGORY, results : search.info.category, cards : search.list.category, key : KEYS.CATEGORY, strings : mainGame.get.strings.category, switchs : 'category' },
				]"
			>
				<div>
					<span>{{ mainGame.get.text(j.span) }}&nbsp;:</span>
					<var-switch v-model = 'search.switchs[j.switchs as keyof typeof search.switchs]' v-if = 'j.switchs !== undefined'/>
					<span v-if = 'j.switchs !== undefined' class = 'switch'>{{ search.switchs[j.switchs as keyof typeof search.switchs] ? 'and' : 'or' }}</span>
				</div>
				<div>
					<div
						v-for = 'i in j.cards'
						:class = "{ 'selected' : j.results.includes(j.value ? j.value(i) : i), 'ot' : j.class === 'ot' }"
						class = 'cursor'
						@click = 'search.select(j.results, j.value ? j.value(i) : i)'
					>
						<img :src = '(mainGame.get.textures(j.key, i) as string)'/>
						<span>{{ j.strings(j.value ? j.value(i) : i)}}</span>
					</div>
				</div>
			</div>
			<div class = 'link'>
				<div>
					<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_LINK) }}&nbsp;:</span>
					<var-switch v-model = "search.switchs['link' as keyof typeof search.switchs]"/>
					<span class = 'switch'>{{ search.switchs['link' as keyof typeof search.switchs] ? 'and' : 'or' }}</span>
				</div>
				<div></div>
				<div>
					<img
						v-for = 'i in search.list.link[0]'
						:src = '(mainGame.get.textures(KEYS.LINK, i) as [string, string])[search.info.link.includes(i) ? 1 : 0]'
						@click = 'search.select(search.info.link, i)'
						class = 'cursor'
					/>
					<div></div>
					<img
						v-for = 'i in search.list.link[1]'
						:src = '(mainGame.get.textures(KEYS.LINK, i) as [string, string])[search.info.link.includes(i) ? 1 : 0]'
						@click = 'search.select(search.info.link, i)'
						class = 'cursor'
					/>
				</div>
			</div>
			<div
				class = 'input'
			>
				<div>
					<img :src = '(mainGame.get.textures(KEYS.INFO, KEYS.STAR_RANK_LINK) as string)'/>
					<Input
						variant = 'outlined'
						:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_LV)'
						:rules = 'search.rule.number'
						v-model = search.info.lv
					/>
				</div>
				<div>
					<img :src = '(mainGame.get.textures(KEYS.INFO, KEYS.SCALE) as string)'/>
					<Input
						variant = 'outlined'
						:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_SCALE)'
						:rules = 'search.rule.number'
						v-model = search.info.scale
					/>
				</div>
				<div>
					<Input
						variant = 'outlined'
						:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_ATK)'
						:rules = 'search.rule.atk'
						v-model = search.info.atk
					/>
					<Input
						variant = 'outlined'
						:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_DEF)'
						:rules = 'search.rule.atk'
						v-model = search.info.def
					/>
				</div>
			</div>
		</div>
		<div class = 'setting no-scrollbar'
			:style = "{ '--y' : setting.y }"
			ref = 'setting_div'
		>
			<Input
				:placeholder = 'mainGame.get.text(I18N_KEYS.DECK_NAME)'
				:rules = 'setting.name_rule'
				variant = 'outlined'
				v-model = 'setting.name'
			/>
			<div class = 'btn'>
				<div
					v-for = "i in setting.btns"
				>
					<Button
						:icon_name = 'i.icon'
						:content = 'mainGame.get.text(i.key)'
						@click = 'i.func'
					/>
				</div>
			</div>
		</div>
	</main>
</template>
<script setup lang = 'ts'>
	import { onMounted, onUnmounted, reactive, watch, ref, ComponentPublicInstance } from 'vue';

	import mainGame from '@/script/game';
	import Card, { TYPE } from '@/script/card';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS, REG } from '@/script/constant';
	import GLOBAL from '@/script/scale';
	import LFList from '@/script/lflist';
	import Search from '@/pages/deck/search';

	import Pic, { CardPic } from '@/pages/deck/pic.vue';
	import Input from '@/pages/ui/input.vue';
	import Button, { Icon } from '@/pages/ui/button.vue';
	import Select from '@/pages/ui/select.vue';
	import { toast } from '@/pages/toast/toast';
	import Deck from './deck';

	const search_div = ref<HTMLDivElement | null>(null);
	const setting_div = ref<HTMLDivElement | null>(null);
	const list = ref<HTMLDivElement | null>(null);

	const cards = ref<Array<ComponentPublicInstance> | null>(null);
	const page = reactive({
		card : undefined as undefined | CardPic,
		size : {
			width : 0,
			height : 0,
			resize : () : void => {
				page.size.width = (GLOBAL.WIDTH * 0.9 / 3) / props.count;
				page.size.height = page.size.width * 1.45;
			}
		},
		touchstart : (e : TouchEvent) : void => page.start(e.target as HTMLElement),
		mousedown : (e : MouseEvent) : void => page.start(e.target as HTMLElement),
		start : (target : HTMLElement) : void => {
			if (search.off(target)) return;
			if (setting.off(target)) return;
			const v : number = cards.value?.findIndex(i => i.$el.contains(target)) ?? -1;
			if (v < 0) return;
			cards.value![v].$el.style.transition = 'none';
			const card = page.list[v].pic;
			emit('card', card.code);
			emit('hover', [target, card.code]);
			page.card = card;
		},
		end : () : void => page.card = undefined,
		finished : false,
		loading : false,
		button_loading : false,
		list : [] as Array<{ card : Card; pic : CardPic; }>,
		result : [] as Array<{ card : Card; pic : CardPic; }>,
		load_on : async (event ?: Event) : Promise<void> => {
			if (event) {
				const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
				if (scrollHeight / page.list.length < scrollHeight - scrollTop - clientHeight)
					return;
			}
			if (!page.loading && !page.finished) {
				page.loading = true;
				await page.load();
			}
		},
		load : async () : Promise<void> => {
			const length = page.list.length;
			if (page.list.length < page.result.length) {
				const cards = page.result.slice(length, Math.min(page.result.length, length + 100));
				await mainGame.load.pic(cards.map(i => i.pic.code));
				page.list.push(...cards);
			}
			page.loading = false;
			page.finished = page.list.length >= page.result.length;
		},
		back : () => {
			if (list.value)
				list.value.scrollTop = 0;
		}
	});

	const setting = reactive({
		y : `${200 / GLOBAL.SCALE}vh`,
		name : '',
		on : () => setting.y = '-50%',
		off : (target : HTMLElement) : boolean => {
			const vh = `${200 / GLOBAL.SCALE}vh`;
			if (setting.y !== vh
				&& setting_div.value && !setting_div.value.contains(target)
			) {
				setting.y = vh;
				return true;
			}
			return false;
		},
		btns : [
			{ icon : 'save', key : I18N_KEYS.DECK_SETTING_SAVE, func : async () => {
				const rule = await setting.name_rule(setting.name);
				typeof rule == 'boolean' ? emit('save', setting.name) : toast.error(rule);
			} },
			{ icon : 'share', key : I18N_KEYS.DECK_SETTING_SHARE, func : async () => {
				const rule = await setting.name_rule(setting.name);
				typeof rule == 'boolean' ? emit('share', setting.name) : toast.error(rule);
			} },
			{ icon : 'sort', key : I18N_KEYS.DECK_SETTING_SORT, func : () => emit('sort') },
			{ icon : 'disrupt', key : I18N_KEYS.DECK_SETTING_DISRUPT, func : () => emit('disrupt') },
			{ icon : 'clear', key : I18N_KEYS.DECK_SETTING_CLEAR, func : () => emit('clear') },
		] as Array<{ icon : Icon; key : number; func : Function; }>,
		name_rule : async (name ?: string) : Promise<string | boolean> => {
			if (name === undefined || name.length === 0)
				return mainGame.get.text(I18N_KEYS.RULE_NAME_LEN);
			if (name.match(REG.NAME))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
			if ((await mainGame.load.deck()).filter(i => i.name === name).length > (props.deck.new || (props.deck.name!.length > 0 && props.deck.name !== name) ? 0 : 1))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_EXIST);
			return true;
		}
	});

	const monster_type = [
		TYPE.NORMAL,
		TYPE.EFFECT,
		TYPE.FUSION,
		TYPE.XYZ,
		TYPE.SYNCHRO,
		TYPE.PENDULUM,
		TYPE.LINK,
		TYPE.RITUAL,
		TYPE.TUNER,
		TYPE.SPSUMMON,
		TYPE.SPIRIT,
		TYPE.TOON,
		TYPE.UNION,
		TYPE.DUAL,
		TYPE.FLIP,
		TYPE.TOKEN
	];

	const search = reactive({
		x : `${200 / GLOBAL.SCALE}vw`,
		on : () => search.x = '-50%',
		off : (target : HTMLElement) : boolean => {
			const vw = `${200 / GLOBAL.SCALE}vw`;
			if (search.x !== vw
				&& search_div.value && !search_div.value.contains(target)
				&& !target.classList.contains('var-option__cover')
			) {
				search.x = vw;
				return true;
			}
			return false;
		},
		select : (results : Array<number>, i : number) => {
			const ct = results.indexOf(i);
			if (ct > -1)
				results.splice(ct, 1);
			else
				results.push(i);
		},
		list : {
			card : [
				TYPE.MONSTER,
				TYPE.SPELL,
				TYPE.TRAP
			],
			monster : monster_type,
			spell : [
				TYPE.NORMAL | TYPE.SPELL,
				TYPE.QUICKPLAY,
				TYPE.CONTINUOUS,
				TYPE.RITUAL | TYPE.SPELL,
				TYPE.EQUIP,
				TYPE.FIELD,
				TYPE.COUNTER
			],
			attribute : Array.from(mainGame.strings.get(KEYS.ATTRIBUTE)?.keys() ?? []) as Array<number>,
			race : Array.from(mainGame.strings.get(KEYS.RACE)?.keys() ?? []) as Array<number>,
			category : Array.from(mainGame.strings.get(KEYS.CATEGORY)?.keys() ?? []) as Array<number>,
			ot : Array.from(mainGame.strings.get(KEYS.OT)?.keys() ?? []) as Array<number>,
			except : monster_type.slice(),
			link : (() => {
				const arr = Array.from(mainGame.textures.get(KEYS.LINK)?.keys() ?? []) as Array<number>;
				return [
					arr.slice(0, Math.ceil(arr.length / 2)),
					arr.slice(Math.ceil(arr.length / 2))
				];
			})()
		},
		info : {
			ot : [] as Array<number>,
			type : [[], [], [], []] as [Array<number>, Array<number>, Array<number>, Array<number>],
			attribute : [] as Array<number>,
			race : [] as Array<number>,
			category : [] as Array<number>,
			link : [] as Array<number>,
			lflist : '',
			forbidden : '',
			lv : '',
			atk : '',
			def : '',
			scale : '',
			desc : ''
		},
		switchs : {
			'type' : false,
			'category' : false,
			'link' : false,
		},
		rule : {
			number : (lv : string) : string | boolean => {
				if (!lv.match(REG.LV))
					return mainGame.get.text(I18N_KEYS.DECK_RULE_SEARCH_LV);
				return true;
			},
			atk : (lv : string) : string | boolean => {
				if (!lv.match(REG.ATK))
					return mainGame.get.text(I18N_KEYS.DECK_RULE_SEARCH_ATK);
				return true;
			}
		},
		search : async () : Promise<void> => {
			page.list.length = 0;
			page.finished = false;
			const searcher = new Search()
				.set.cards(Array.from(mainGame.cards).map(i => i[1]))
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
				.set.desc(search.info.desc)
				.set.and_or(search.switchs);
			page.result = searcher.search().map(i => {
				return {
					card : i,
					pic : { code : i.id, index : 0, y : 0, loc : 1, key : Math.random().toString() }
				};
			});
			await page.load_on();
		}
	});

	const emit = defineEmits<{
		card : [card : number];
		lflist : [lflist ?: LFList];
		save : [name : string];
		share : [name : string];
		sort : [];
		disrupt : [];
		clear : [];
		exit : [];
		hover : [para : [HTMLElement, number]];
		add : [code : number];
	}>();

	const props = defineProps<{
		width : number;
		height : number;
		count : number;
		deck : Deck;
	}>();

	onMounted(async () => {
		page.size.resize();
		window.addEventListener('mousedown', page.mousedown);
		window.addEventListener('touchstart', page.touchstart);
		window.addEventListener('mouseup', page.end);
		await search.search();
	});

	onUnmounted(() => {
		window.removeEventListener('mousedown', page.mousedown);
		window.removeEventListener('touchstart', page.touchstart);
		window.removeEventListener('mouseup', page.end);
	});

	watch(() => props.deck.name, (n) => setting.name = n ?? '', { immediate : true });
	watch(() => search.info.lflist, (n) => emit('lflist', n ? mainGame.get.lflist(n) : undefined));
</script>
<style lang = 'scss' scoped>
	$head-height: 60px;
	$foot-height: 30px;
	main {
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
			gap: 10px;
			.var-input {
				width: 80%;
			}
		}
		> div:nth-child(2) {
			height: calc(100% - $head-height - $foot-height);
			width: calc(100% - 10px);
			overflow-y: auto;
			overflow-x: hidden;
			scroll-behavior: smooth;
			.list {
				position: relative;
				width: calc(100% - 15px);
				> div {
					position: relative;
					height: var(--height);
					> div:last-child {
						position: absolute;
						top: 0;
						left: var(--width);
						width: calc(100% - var(--width));
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						> span:first-child {
							font-weight: bold;
						}
						> span:last-child {
							color: rgb(203, 203, 203);
							font-size: 12px;
						}
					}
				}
			}
		}
		> div:nth-child(3) {
			position: relative;
			height: $foot-height;
			display: flex;
			gap: 5px;
			> p {
				position: absolute;
				border: 1px solid white;
				border-radius: 4px;
				height: 30px;
				width: 30px;
				right: 5px;
				transform: translateY(- $foot-height);
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
		.search {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(var(--x), -50%);
			width: calc(var(--width) * 2);
			height: var(--height);
			background-color: rgba(0, 0, 0, 0.8);
			color: white;
			overflow-y: auto;
			transition: all 0.2s ease;
			> div {
				margin-left: 10px;
				max-width: calc(100% - 10px);
			}
			.lflist {
				height: 120px;
				gap: 10px;
				.var-select, .var-input {
					width: 40%;
				}
			}
			.select, .input, .lflist {
				display: flex;
				flex-direction: column;
			}
			.select, .link {
				> div:first-child {
					width: calc(var(--width) / 2);
					display: flex;
					align-items: center;
					gap: 5px;
					.switch {
						color: rgb(203, 203, 203);
						font-size: 12px;
					}
				}
			}
			.select {
				> div:last-child {
					display: flex;
					flex-wrap: wrap;
					gap: 10px;
					> div {
						display: flex;
						flex-direction: column;
						align-items: center;
						border: 2px solid white;
						width: 50px;
						height: 60px;
						border-radius: 8px;
						transition: all 0.1s ease;
						img {
							width: 40px;
							height: 40px;
						}
						span {
							font-size: 12px;
						}
					}
					> .selected {
						border: 2px solid #2196f3;
						box-shadow: 0 0 10px white;
					}
					> .ot {
						width: 60px;
						img {
							width: 50px;
							height: 40px;
						}
					}
				}
			}
			.link {
				width: 120px;
				height: 150px;
				position: relative;
				> div:nth-child(2) {
					position: absolute;
					width: 84px;
					height: 84px;
					border: 1px solid rgba($color: white, $alpha: 1);
					top: calc(50% + 8px);
					left: 50%;
					transform: translate(-50%, -50%);
				}
				> div:last-child {
					position: absolute;
					width: 120px;
					height: 120px;
					display: grid;
					grid-template-rows: repeat(3, 1fr);
					grid-template-columns: repeat(3, 1fr);
					img {
						width: 40px;
						height: 40px;
					}
				}
			}
			.input {
				> div {
					display: flex;
					gap: 5px;
					min-height: 50px;
					.var-input {
						width: 40%;
					}
					img {
						width: 40px;
						height: 40px;
					}
				}
			}
		}
		.setting {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, var(--y));
			width: 500px;
			height: 130px;
			background-color: rgba(0, 0, 0, 0.8);
			color: white;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			align-items: center;
			transition: all 0.2s ease;
			.var-input {
				margin-top: 15px;
				width: 90%;
				height: 70px;
			}
			.btn {
				width: 90%;
				display: flex;
				flex-wrap: wrap;
				gap: 5px;
				&::-webkit-scrollbar {
					display: none;
				}
				> div {
					flex: 1;
					min-width: 85px;
					height: 30px;
				}
			}
		}
	}
</style>