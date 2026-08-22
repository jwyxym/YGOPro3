<template>
	<div class = 'system no-scrollbar' ref = 'system' v-if = '!page.i18n.changing'>
		<var-list>
			<var-cell>
				<template #default>
					<Select
						name = 'i18n'
						:clearable = 'false'
						v-model = 'page.i18n.value'
						@change = 'page.i18n.change'
					/>
				</template>
			</var-cell>
			<var-cell>
				<template #default>
					<Select
						name = 'frame'
						:clearable = 'false'
						v-model = 'page.frame.value'
						@change = 'page.frame.change'
					/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.sound'
			>
				<template #default>
					{{ `${mainGame.get.text(i.key)} : ${i.ct.toFixed(2)}` }}
					<Slider
						:x = 'i.ct'
						@dragging = i.dragging
						@drag_end = i.end
					/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.bool'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
			>
				<template #extra>
					<var-switch
						v-model = 'i.value'
						@change = 'page.change(i)'/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.number'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
			>
				<template #extra>
					<var-counter
						:min = '0'
						:max = '999'
						v-model = 'i.value'
						@change = 'page.change(i)'/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.string'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
			>
				<template #extra>
					<Input
						v-model = 'i.value'
						:maxlength = 'i.max'
						:clearable = 'false'
						@blur = 'page.change(i)'/>
				</template>
			</var-cell>
			<var-cell class = 'extend'>
				<template #default>
					<Input
						:placeholder = 'mainGame.get.text(page.extend.i18n)'
						v-model = 'page.extend.value'
						:clearable = 'false'
						@enter = 'page.extend.push()'
					/>
				</template>
				<template #extra>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.CONFIRM)'
						@click = 'page.extend.push()'
					/>
				</template>
			</var-cell>
			<Dglab
				class = 'extend'
				v-if = 'page.extend.dglab'
				:height = 'GLOBAL.SCALE < 0.6 ? 100 : 60'
				:icon = 'true'
				@change = 'page.change'
				@off = '(key : string) => page.extend.del(key)'
				@open = 'page.scroll'
			/>
		</var-list>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive, ref, useTemplateRef, watch } from 'vue';
	import { toUpper } from 'lodash';
	import PQueue from 'p-queue';

	import { KEYS } from '@/script/constant';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import GLOBAL from '@/script/scale';
	import { voice } from '@/pages/voice/voice';
	import Select from '@/pages/ui/select.vue';
	import Input from '@/pages/ui/input.vue';
	import Slider from '@/pages/ui/slider.vue';
	import Button from '@/pages/ui/button.vue';

	import Dglab from './extend/dglab.vue';

	const system = useTemplateRef('system');

	class Sound_Setting {
		key : number;
		ct = ref(0);
		dragging : (v : number) => Promise<void>;
		end : (v : number) => Promise<void>;
		constructor (key : number, ct : number, dragging : (v : number) => Promise<void>, end : (v : number) => Promise<void>) {
			this.key = key;
			this.ct.value = ct;
			this.end = end;
			this.dragging = async (v : number) => {
				this.ct.value = v;
				await dragging(v);
			};
		}
	};

	const queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});

	const page = reactive({
		i18n : {
			value : mainGame.get.system(KEYS.I18N) as string,
			changing : false,
			change : async (i : string) : Promise<void> => {
				console.log(i)
				if (i === mainGame.get.system(KEYS.I18N))
					return;
				page.i18n.changing = true;
				await mainGame.set.system(KEYS.I18N, i);
				await mainGame.reload();
				page.i18n.changing = false;
			}
		},
		frame : {
			value : mainGame.get.system(KEYS.SETTING_FRAME) as number,
			change : async (i : number) : Promise<void> => {
				if (i === mainGame.get.system(KEYS.SETTING_FRAME))
					return;
				await mainGame.set.system(KEYS.SETTING_FRAME, i);
			}
		},
		number : [] as Array<{ i18n : number, key : string; value : number; }>,
		bool : [] as Array<{ i18n : number, key : string; value : boolean; }>,
		string : [] as Array<{ i18n : number, key : string; value : string; max ?: number }>,
		extend : {
			i18n : I18N_KEYS.SETTING_EXTEND,
			value : '',
			dglab : false,
			flush : function (extend : Array<string>) {
				this.value = '';
				this.dglab = extend.includes('DGLAB');
			},
			push : function () {
				const extend = (mainGame.get.system(KEYS.SETTING_EXTEND)! as Array<string>);
				const key : string = toUpper(this.value);
				if (!extend.includes(key)) {
					extend.push(key);
					queue.add(async () => await mainGame.set.system(KEYS.SETTING_EXTEND, extend, true));
				}
				this.flush(extend);
			},
			del : function (key : string) {
				key = toUpper(key);
				const extend = (mainGame.get.system(KEYS.SETTING_EXTEND)! as Array<string>);
				const i = extend.indexOf(key);
				if (i > - 1) {
					extend.splice(i, 1);
					queue.add(async () => await mainGame.set.system(KEYS.SETTING_EXTEND, extend, true));
				}
				this.flush(extend);
			}
		},
		sound : [
			new Sound_Setting(
				I18N_KEYS.SETTING_VOICE_BGM,
				mainGame.get.system(KEYS.SETTING_VOICE_BGM) as number,
				async (v : number) => {
					voice.update.bgm(v);
				},
				async (v : number) => {
					await mainGame.set.system(KEYS.SETTING_VOICE_BGM, v);
					voice.update.bgm();
				}
			),
			new Sound_Setting(
				I18N_KEYS.SETTING_VOICE_SOUND_EFFECT,
				mainGame.get.system(KEYS.SETTING_VOICE_SOUND_EFFECT) as number,
				async (v : number) => {
					mainGame.system.get(KEYS.NUMBER)!.set(KEYS.SETTING_VOICE_SOUND_EFFECT, v);
					voice.update.sound_effect();
				},
				async (v : number) => {
					await mainGame.set.system(KEYS.SETTING_VOICE_SOUND_EFFECT, v);
					voice.update.sound_effect();
					await voice.play.sound_effect(KEYS.SOUND_EFFECT_ACTIVATE);
				}
			)
		],
		change : (
			obj : { i18n : number, key : string; value : any; }
		) => {
			if (obj.key === KEYS.SETTING_SEARCH_SPLIT && !obj.value) {
				obj.value = '%%';
				return;
			}
			queue.add(async () => await mainGame.set.system(obj.key, obj.value));
		},
		scroll : (value : number) => setTimeout(
			() => system.value
				?.scrollBy({
					top : value,
					behavior : 'smooth'
				}), 200)
	});

	onBeforeMount(() => {
		page.number = [
			'SETTING_CT_CARD',
			'SETTING_CT_DECK_MAIN',
			'SETTING_CT_DECK_EX',
			'SETTING_CT_DECK_SIDE',
			'SETTING_CT_DECK_PRELINE',
			'SETTING_CT_SIDE_PRELINE',
			'SETTING_CT_ABOUT_PRELINE',
			'SETTING_CT_DOWNLOADCHUNKS_RETRIES'
		].map(i => {
			return {
				i18n : I18N_KEYS[i as keyof typeof I18N_KEYS],
				key : KEYS[i as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i as keyof typeof KEYS]) as number
			};
		});
		page.bool = [
			'SETTING_CHK_DELETE_YPK',
			'SETTING_CHK_DELETE_REPLAY',
			'SETTING_CHK_DELETE_DECK',
			'SETTING_CHK_EXIT_DECK',
			'SETTING_CHK_SORT_DECK',
			'SETTING_CHK_DISRUPT_DECK',
			'SETTING_CHK_CLEAR_DECK',
			'SETTING_CHK_SURRENDER',
			'SETTING_CHK_EXIT_SERVER',
			'SETTING_CHK_SWAP_BUTTON',
			'SETTING_CHK_HIDDEN_NAME',
			'SETTING_CHK_HIDDEN_CHAT'
		].map(i => {
			return {
				i18n : I18N_KEYS[i as keyof typeof I18N_KEYS],
				key : KEYS[i as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i as keyof typeof KEYS]) as boolean
			};
		});
		page.string = [
			['SETTING_SERVER_PLAYER_NAME', 20],
			['SETTING_SEARCH_SPLIT', 5]
		].map(i => {
			return {
				i18n : I18N_KEYS[i[0] as keyof typeof I18N_KEYS],
				key : KEYS[i[0] as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i[0] as keyof typeof KEYS]) as string,
				max : i[1] as number | undefined
			};
		});
		const extend = mainGame.get.system(KEYS.SETTING_EXTEND) as Array<string>;
		page.extend.dglab = extend.includes('DGLAB');
	});

	const emit = defineEmits<{ i18n : [boolean]; }>();
	watch(() => page.i18n.changing, (n : boolean) => emit('i18n', n));
</script>
<style scoped lang = 'scss'>
	.system {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		.var-cell {
			height: 60px;
			:deep(.var-cell__extra) {
				display: flex;
				height: 40px;
				transform: translateX(-10px);
				.var-input {
					width: 200px;
					[media = 'mobile'] & {
						transform: scale(140%) translate(-40px, -10px);
					}
					[media = 'pc'] & {
						transform: translateY(-10px);
					}
				}
			}
		}
		.extend {
			:deep(.var-input) {
				width: 500px;
			}
			:deep(.var-cell) {
				height: 60px;
				.var-cell__extra {
					display: flex;
					transform: translateX(-10px);
					.var-input {
						[media = 'mobile'] & {
							transform: scale(140%) translateX(-130px);
						}
					}
				}
			}
		}
	}
</style>