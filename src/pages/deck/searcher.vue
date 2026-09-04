<template>
	<div
		class = 'ygopro3__deck__search search no-scrollbar'
		ref = 'search'
	>
		<div class = 'lflist'>
			<Select
				name = 'lflist'
				v-model = 'page.info.lflist'
			/>
			<Input
				:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_FORBIDDEN)'
				:rules = 'page.rule.number'
				v-model = 'page.info.forbidden'
			/>
		</div>
		<div
			class = 'select'
			v-for = "j in [
				{ span : I18N_KEYS.CARD_INFO_OT, results : page.info.ot, cards : page.list.ot, key : KEYS.OT, model : 'ot', strings : mainGame.get.strings.ot, class : 'ot' },
				{ span : I18N_KEYS.CARD_INFO_TYPE, results : page.info.type[0], cards : page.list.card, key : KEYS.TYPE, model : 'type', type : 0, strings : mainGame.get.strings.type },
				{ span : I18N_KEYS.CARD_INFO_SPELL_TRAP_TYPE,  results : page.info.type[1], cards : page.list.spell, key : KEYS.TYPE, model : 'type', type : 1, strings : mainGame.get.strings.type, value : (i : number) => i & ~ 3 },
				{ span : I18N_KEYS.CARD_INFO_MONSTER_TYPE,  results : page.info.type[2], cards : page.list.monster, key : KEYS.TYPE, model : 'type', type : 2, strings : mainGame.get.strings.type, value : (i : number) => i & ~ 3, switchs : 'type' },
				{ span : I18N_KEYS.CARD_INFO_EXCEPT_TYPE,  results : page.info.type[3], cards : page.list.except, key : KEYS.TYPE, model : 'type', type : 3, strings : mainGame.get.strings.type, value : (i : number) => i & ~ 3 },
				{ span : I18N_KEYS.CARD_INFO_ATTRIBUTE, results : page.info.attribute, cards : page.list.attribute, key : KEYS.ATTRIBUTE, model : 'attribute', strings : mainGame.get.strings.attribute },
				{ span : I18N_KEYS.CARD_INFO_RACE, results : page.info.race, cards : page.list.race, key : KEYS.RACE, model : 'race', strings : mainGame.get.strings.race },
				{ span : I18N_KEYS.CARD_INFO_CATEGORY, results : page.info.category, cards : page.list.category, key : KEYS.CATEGORY, model : 'category', strings : mainGame.get.strings.category, switchs : 'category' },
			]"
		>
			<div>
				<span>{{ mainGame.get.text(j.span) }}&nbsp;:</span>
				<var-switch v-model = 'page.switchs[j.switchs as keyof typeof page.switchs]' v-if = 'j.switchs !== undefined'/>
				<span v-if = 'j.switchs !== undefined' class = 'switch'>{{ page.switchs[j.switchs as keyof typeof page.switchs] ? 'and' : 'or' }}</span>
			</div>
			<div>
				<div
					v-for = 'i in j.cards'
					:class = "{ 'selected' : j.results.includes(j.value ? j.value(i) : i), 'ot' : j.class === 'ot' }"
					class = 'cursor'
					@click = "page.select(j.model as ArrayInfoKey, j.value ? j.value(i) : i, j.type as TypeIndex | undefined)"
				>
					<img :src = '(mainGame.get.textures(j.key, i) as string)'/>
					<span>{{ j.strings(j.value ? j.value(i) : i) }}</span>
				</div>
			</div>
		</div>
		<div class = 'link'>
			<div>
				<span>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_LINK) }}&nbsp;:</span>
				<var-switch v-model = "page.switchs['link' as keyof typeof page.switchs]"/>
				<span class = 'switch'>{{ page.switchs['link' as keyof typeof page.switchs] ? 'and' : 'or' }}</span>
			</div>
			<div></div>
			<div>
				<img
					v-for = 'i in page.list.link[0]'
					:src = '(mainGame.get.textures(KEYS.LINK, i) as [string, string])[page.info.link.includes(i) ? 1 : 0]'
					@click = "page.select('link', i)"
					class = 'cursor'
				/>
				<div></div>
				<img
					v-for = 'i in page.list.link[1]'
					:src = '(mainGame.get.textures(KEYS.LINK, i) as [string, string])[page.info.link.includes(i) ? 1 : 0]'
					@click = "page.select('link', i)"
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
					:rules = 'page.rule.number'
					v-model = page.info.lv
				/>
			</div>
			<div>
				<img :src = '(mainGame.get.textures(KEYS.INFO, KEYS.SCALE) as string)'/>
				<Input
					variant = 'outlined'
					:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_SCALE)'
					:rules = 'page.rule.number'
					v-model = page.info.scale
				/>
			</div>
			<div>
				<Input
					variant = 'outlined'
					:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_ATK)'
					:rules = 'page.rule.atk'
					v-model = page.info.atk
				/>
				<Input
					variant = 'outlined'
					:placeholder = 'mainGame.get.text(I18N_KEYS.CARD_INFO_DEF)'
					:rules = 'page.rule.atk'
					v-model = page.info.def
				/>
			</div>
		</div>
		<div>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.DECK_BTN_SEARCH_ON)'
					@click = "emit('search')"
				/>
			</div>
			<div>
				<Button
					:content = 'mainGame.get.text(I18N_KEYS.DECK_BTN_SEARCH_CLEAR)'
					@click = "emit('clear')"
				/>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { computed, onMounted, onUnmounted, reactive, useTemplateRef } from 'vue';

	import mainGame from '@/script/game';
	import { TYPE } from '@/script/card';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS, REG } from '@/script/constant';
	import LFList from '@/script/lflist';

	import Input from '@/ui/input.vue';
	import Button from '@/ui/button.vue';
	import Select from '@/ui/select.vue';

	type TypeInfo = [Array<number>, Array<number>, Array<number>, Array<number>];
	type TypeIndex = 0 | 1 | 2 | 3;
	type ArrayInfoKey = 'ot' | 'type' | 'attribute' | 'race' | 'category' | 'link';
	const search = useTemplateRef('search');

	const props = defineProps<{
		ot : Array<number>;
		type : TypeInfo;
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
		desc : string;
		typeSwitch : boolean;
		categorySwitch : boolean;
		linkSwitch : boolean;
	}>();

	const emit = defineEmits<{
		clear : [];
		search : [];
		lflist : [lflist ?: LFList];
		exit : [];
		close : [];
		'update:ot' : [value : Array<number>];
		'update:type' : [value : TypeInfo];
		'update:attribute' : [value : Array<number>];
		'update:race' : [value : Array<number>];
		'update:category' : [value : Array<number>];
		'update:link' : [value : Array<number>];
		'update:lflist' : [value : string];
		'update:forbidden' : [value : string];
		'update:lv' : [value : string];
		'update:atk' : [value : string];
		'update:def' : [value : string];
		'update:scale' : [value : string];
		'update:desc' : [value : string];
		'update:typeSwitch' : [value : boolean];
		'update:categorySwitch' : [value : boolean];
		'update:linkSwitch' : [value : boolean];
	}>();

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

	const page = reactive({
		info : {
			ot : computed({
				get : () => props.ot,
				set : (value) => emit('update:ot', value)
			}),
			type : computed({
				get : () => props.type,
				set : (value) => emit('update:type', value)
			}),
			attribute : computed({
				get : () => props.attribute,
				set : (value) => emit('update:attribute', value)
			}),
			race : computed({
				get : () => props.race,
				set : (value) => emit('update:race', value)
			}),
			category : computed({
				get : () => props.category,
				set : (value) => emit('update:category', value)
			}),
			link : computed({
				get : () => props.link,
				set : (value) => emit('update:link', value)
			}),
			lflist : computed({
				get : () => props.lflist,
				set : (value) => emit('update:lflist', value)
			}),
			forbidden : computed({
				get : () => props.forbidden,
				set : (value) => emit('update:forbidden', value)
			}),
			lv : computed({
				get : () => props.lv,
				set : (value) => emit('update:lv', value)
			}),
			atk : computed({
				get : () => props.atk,
				set : (value) => emit('update:atk', value)
			}),
			def : computed({
				get : () => props.def,
				set : (value) => emit('update:def', value)
			}),
			scale : computed({
				get : () => props.scale,
				set : (value) => emit('update:scale', value)
			}),
			desc : computed({
				get : () => props.desc,
				set : (value) => emit('update:desc', value)
			})
		},
		switchs : {
			type : computed({
				get : () => props.typeSwitch,
				set : (value) => emit('update:typeSwitch', value)
			}),
			category : computed({
				get : () => props.categorySwitch,
				set : (value) => emit('update:categorySwitch', value)
			}),
			link : computed({
				get : () => props.linkSwitch,
				set : (value) => emit('update:linkSwitch', value)
			})
		},
		select : (key : ArrayInfoKey, i : number, type ?: TypeIndex) => {
			const toggle = (results : Array<number>) => {
				const next = results.slice();
				const ct = next.indexOf(i);
				if (ct > -1)
					next.splice(ct, 1);
				else
					next.push(i);
				return next;
			};
			if (key === 'type') {
				if (type === undefined)
					return;
				const next = props.type.map(i => i.slice()) as TypeInfo;
				next[type] = toggle(next[type]);
				emit('update:type', next);
				return;
			}
			const next = toggle(props[key]);
			switch (key) {
				case 'ot':
					emit('update:ot', next);
					break;
				case 'attribute':
					emit('update:attribute', next);
					break;
				case 'race':
					emit('update:race', next);
					break;
				case 'category':
					emit('update:category', next);
					break;
				case 'link':
					emit('update:link', next);
					break;
			}
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
	});
	const close = (event : MouseEvent) => {
		const target = event.target as HTMLElement;
		if (search.value?.contains(target)
			|| (target).classList.contains('var-option__cover'))
			return;
		emit('close');
	};

	onMounted(() => document.addEventListener('click', close, true));
	onUnmounted(() => document.removeEventListener('click', close, true));
</script>
<style lang = 'scss' scoped>
	.search {
		width: calc(var(--width) * 0.8);
		height: calc(var(--height) * 0.95);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		overflow-y: auto;
		[media = 'mobile'] & {
			font-size: 24px;
		}
		> div {
			margin-left: 10px;
			max-width: calc(100% - 10px);
			[media = 'mobile'] & {
				.var-select,
				.var-switch {
					transform: scale(140%);
					transform-origin: left center;
				}
			}
		}
		.lflist {
			[media = 'mobile'] & {
				height: 150px;
				gap: 20px;
			}
			[media = 'pc'] & {
				height: 120px;
				gap: 10px;
			}
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
				width: var(--width);
				display: flex;
				align-items: center;
				[media = 'mobile'] & {
					gap: 20px;
					> span {
						font-size: 24px;
						height: 40px;
					}
				}
				[media = 'pc'] & {
					gap: 5px;
				}
				.switch {
					color: rgb(203, 203, 203);
					font-size: 12px;
				}
			}
		}
		.select {
			> div:first-child {
				[media = 'mobile'] > span:first-child {
					height: 40px;
				}
			}
			> div:last-child {
				display: flex;
				flex-wrap: wrap;
				[media = 'mobile'] & {
					gap: 20px;
				}
				[media = 'pc'] & {
					gap: 10px;
				}
				> div {
					display: flex;
					flex-direction: column;
					align-items: center;
					border: 2px solid white;
					transition: all 0.1s ease;
					[media = 'mobile'] & {
						width: 75px;
						height: 90px;
						border-radius: 11.2px;
					}
					[media = 'pc'] & {
						width: 50px;
						height: 60px;
						border-radius: 8px;
					}
					img {
						[media = 'mobile'] & {
							width: 56px;
							height: 56px;
						}
						[media = 'pc'] & {
							width: 40px;
							height: 40px;
						}
					}
					span {
						[media = 'mobile'] & {
							font-size: 18px;
						}
						[media = 'pc'] & {
							font-size: 12px;
						}
					}
				}
				> .selected {
					border: 2px solid yellow;
					box-shadow: 0 0 10px yellow;
				}
				> .ot {
					[media = 'mobile'] & {
						width: 90px;
					}
					[media = 'pc'] & {
						width: 60px;
					}
					img {
						[media = 'mobile'] & {
							width: 70px;
							height: 56px;
						}
						[media = 'pc'] & {
							width: 50px;
							height: 40px;
						}
					}
				}
			}
		}
		.link {
			[media = 'mobile'] & {
				height: 220px;
			}
			[media = 'pc'] & {
				height: 150px;
			}
			width: 120px;
			position: relative;
			> div:nth-child(2) {
				position: absolute;
				width: 84px;
				height: 84px;
				border: 1px solid rgba($color: white, $alpha: 1);
				top: calc(50% + 8px);
				left: 50%;
				[media = 'mobile'] & {
					transform: scale(140%) translate(calc(-50% + 17px), calc(-50% + 4px));
					transform-origin: left top;
				}
				[media = 'pc'] & {
					transform: translate(-50%, -50%);
				}
			}
			> div:last-child {
				position: absolute;
				width: 120px;
				height: 120px;
				display: grid;
				grid-template-rows: repeat(3, 1fr);
				grid-template-columns: repeat(3, 1fr);
				[media = 'mobile'] & {
					transform: scale(140%);
					transform-origin: left top;
				}
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
			[media = 'mobile'] & {
				height: 270px;
				gap: 20px;
				> div:last-child {
					flex-direction: column;
					gap: 20px;
				}
			}
		}
		> div:last-child {
			display: flex;
			align-items: center;
			[media = 'mobile'] & {
				height: 70px;
			}
			> div {
				width: 50%;
				display: flex;
				justify-content: center;
				align-items: center;
			}
		}
	}
</style>