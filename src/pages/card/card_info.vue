<template>
	<div class = 'ygopro3__info'>
		<var-tabs v-model:active = 'page.select'>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.CARD_INFO) }}</var-tab>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.CARD_PIC) }}</var-tab>
			<var-tab>{{ mainGame.get.text(I18N_KEYS.CARD_CODE) }}</var-tab>
			<var-tab v-if = 'mainGame.get.system(KEYS.SETTING_CHK_SPINE)'>{{ mainGame.get.text(I18N_KEYS.CARD_SPINE) }}</var-tab>
		</var-tabs>
		<transition name = 'opacity'>
			<div v-if = 'page._select === 3'>
				<div
					:ref = 'page.spine.set_host'
					class = 'spine'
				/>
			</div>
			<div v-else-if = 'page._select === 2'>
				<Code
					v-if = 'page.code.value !== undefined'
					v-model = 'page.code.value'
					:readonly = 'true'
				/>
			</div>
			<div v-else-if = 'page._select === 1'>
				<ShinyCard
					v-if = 'page.pic.value'
					class = 'card'
					:src = 'page.pic.value'
					:alt = 'props.card.name'
					:disabled = 'false'
					:max-tilt = '12'
				/>
			</div>
			<div v-else class = 'card-info no-scrollbar'>
				<div class = 'card-info__header'>
					<span class = 'card_name'>{{ props.card.name }}</span>
					<span>{{ props.card.id }}</span>
				</div>
				<div class = 'card-info__stats'>
					<div v-for = 'item in page.info.stats' :key = 'item.key'>
						<span class = 'card-info__label'>{{ mainGame.get.text(item.key) }}&nbsp;:</span>
						<span>{{ item.value }}</span>
					</div>
				</div>
				<div v-if = 'page.info.setcode.length' class = 'card-info__setcode'>
					<span class = 'card-info__label'>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_SETCODE) }}&nbsp;:</span>
					<span v-for = '(name, index) in page.info.setcode' :key = 'index'>{{ name }}</span>
				</div>
				<div class = 'card-info__description'>
					<span class = 'card-info__label'>{{ mainGame.get.text(I18N_KEYS.CARD_INFO_DESC) }}&nbsp;:</span>
					<p>{{ props.card.desc }}</p>
				</div>
			</div>
		</transition>
    </div>
</template>
<script setup lang = 'ts'>
	import { computed, nextTick, onBeforeUnmount, reactive, watch } from 'vue';
	import type { ComponentPublicInstance } from 'vue';
	import { ShinyCard } from 'shinycard';

	import mainGame from '@/script/game';
	import { KEYS } from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Card, { TYPE } from '@/script/card';
	import invoke from '@/script/invoke';
	import { Spine } from '@/script/spine';

	import Code from '@/ui/code.vue';
	const spine : Spine = new Spine();

	const page = reactive({
		_select : 0,
		select : computed({
			get : () : number => page._select,
			set : (value) => {
				page._select = value;
				switch (page._select) {
					case 0:
						break;
					case 1:
						page.pic.load();
						break;
					case 2:
						page.code.load();
						break;
					case 3:
						break;
				}
			}
		}),
		spine : {
			host : null as HTMLElement | null,
			set_host : function (element : Element | ComponentPublicInstance | null) : void {
				page.spine.host = element instanceof HTMLElement ? element : null;
			}
		},
		pic : {
			value : undefined as undefined | string,
			loading : false,
			load : async function () {
				if (this.value !== undefined || this.loading)
					return;
				this.loading = true;
				if (!props.card.pic) {
					await mainGame.load.pic([props.card.id]);
					await nextTick();
				}
				this.value = props.card.pic;
				this.loading = false;
			}
		},
		code : {
			value : undefined as undefined | string,
			loading : false,
			load : async function () {
				if (this.value !== undefined || this.loading)
					return;
				this.loading = true;
				this.value = props.card.type & TYPE.NORMAL
					? ''
					: await invoke.game.get_script(props.card.id)
				this.loading = false;
			}
		},
		info : computed(() => {
			const card = props.card;
			const stats = [{ key : I18N_KEYS.CARD_INFO_TYPE, value : mainGame.get.strings.type(card.type) }];
			if (card.is_monster()) {
				stats.push({ key : I18N_KEYS.CARD_INFO_LV, value : card.level.toString() });
				if (card.is_pendulum())
					stats.push({ key : I18N_KEYS.CARD_INFO_SCALE, value : card.scale.toString() });
				stats.push(
					{ key : I18N_KEYS.CARD_INFO_RACE, value : mainGame.get.strings.race(card.race) },
					{ key : I18N_KEYS.CARD_INFO_ATTRIBUTE, value : mainGame.get.strings.attribute(card.attribute) },
					{ key : I18N_KEYS.CARD_INFO_ATK, value : card.atk >= 0 ? card.atk.toString() : '?' }
				);
				if (!card.is_link())
					stats.push({ key : I18N_KEYS.CARD_INFO_DEF, value : card.def >= 0 ? card.def.toString() : '?' });
			}
			return {
				stats,
				setcode : card.setcode.filter(i => i).map(i => mainGame.get.strings.setcode(i))
			};
		})
	});

	const props = defineProps<{
		card : Card;
	}>();

	watch(
		() : [number, number, HTMLElement | null] => [page._select, props.card.id, page.spine.host],
		([select, id, host] : [number, number, HTMLElement | null]) : void => {
			spine.destroy();
			if (select === 3 && host instanceof HTMLElement) {
				spine.mount(host);
				spine.play(id, true);
			}
		},
		{ flush : 'post' }
	);

	onBeforeUnmount(() : void => {
		spine.destroy();
	});
</script>
<style scoped lang = 'scss'>
	.ygopro3__info {
		width: 100%;
		height: 100%;
		> div:nth-child(2),
		> div:nth-child(3) {
			position: absolute;
			top: 80px;
			width: 100%;
			height: calc(100% - 80px);
			display: flex;
			&:not(.card-info) {
				justify-content: center;
				align-items: center;
			}
			> .card {
				height: 80%;
				width: 50%;
			}
			> .spine {
				height: 90%;
				width: 100%;
			}
		}
		> .card-info {
			box-sizing: border-box;
			padding: 20px;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: stretch;
			gap: 20px;
			text-align: left;
			overflow-wrap: anywhere;
			overflow-y: auto;
			color: white;
			> div {
				flex-shrink: 0;
			}
			[media = 'mobile'] & {
				font-size: 24px;
			}
			.card-info__header,
			.card-info__setcode {
				display: flex;
				flex-direction: column;
				.card_name {
					[media = 'mobile'] & {
						font-size: 32px;
					}
					font-weight: bold;
				}
			}
			.card-info__stats {
				display: flex;
				flex-wrap: wrap;
				row-gap: 5px;
				> div {
					width: 50%;
					display: flex;
					flex-direction: column;
					gap: 5px;
				}
			}
			.card-info__label {
				color: rgb(203, 203, 203);
			}
			p {
				white-space: pre-line;
				line-height: 1.6;
			}
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