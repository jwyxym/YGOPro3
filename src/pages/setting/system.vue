<template>
	<div class = 'system no-scrollbar' v-if = '!page.i18n.changing'>
		<var-list>
			<var-cell
				:title = 'mainGame.get.text(I18N_KEYS.SETTING_VOICE)'
				:border = 'true'
			>
			<Select
				name = 'i18n'
				:clearable = 'false'
				v-model = 'page.i18n.value'
				@change = 'page.i18n.change'
				/>
			</var-cell>
			<var-cell
				:title = 'mainGame.get.text(I18N_KEYS.SETTING_VOICE)'
				:border = 'true'
			>
				<template #default>
					{{ `${mainGame.get.text(I18N_KEYS.SETTING_VOICE)} : ${page.sound.ct.toFixed(2)}` }}
					<Slider
						:x = 'page.sound.ct'
						@dragging = page.sound.dragging
						@drag_end = page.sound.end
					/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.bool'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
				:border = 'true'
			>
				<template #extra>
					<var-switch
						v-model = 'i.value'
						@change = 'page.change(i.key, $event)'/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.number'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
				:border = 'true'
			>
				<template #extra>
					<var-counter
						:min = '0'
						:max = '999'
						v-model = 'i.value'
						@change = 'page.change(i.key, i.value)'/>
				</template>
			</var-cell>
		</var-list>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive, watch } from 'vue';

	import { KEYS } from '@/script/constant';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { voice } from '@/pages/voice/voice';
	import Select from '@/pages/ui/select.vue';
	import Slider from '@/pages/ui/slider.vue';

	const page = reactive({
		i18n : {
			value : mainGame.get.system(KEYS.I18N) as string,
			changing : false,
			change : async (i : string) : Promise<void> => {
				if (i === mainGame.get.system(KEYS.I18N))
					return;
				page.i18n.changing = true;
				await mainGame.set.system(KEYS.I18N, i);
				await mainGame.reload();
				page.i18n.changing = false;
			}
		},
		number : [] as Array<{ i18n : number, key : string; value : number; }>,
		bool : [] as Array<{ i18n : number, key : string; value : boolean; }>,
		sound : {
			ct : mainGame.get.system(KEYS.SETTING_VOICE) as number,
			dragging : async (v : number) => {
				page.sound.ct = v;
				mainGame.system.get(KEYS.NUMBER)!.set(KEYS.SETTING_VOICE, v);
				voice.update();
			},
			end : async (v : number) => {
				await mainGame.set.system(KEYS.SETTING_VOICE, v);
				voice.update();
			}
		},
		change : mainGame.set.system
	});

	onBeforeMount(() => {
		page.number = [
			'SETTING_CT_CARD',
			'SETTING_CT_DECK_MAIN',
			'SETTING_CT_DECK_EX',
			'SETTING_CT_DECK_SIDE'
		].map(i => {
			return {
				i18n : I18N_KEYS[i as keyof typeof I18N_KEYS],
				key : KEYS[i as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i as keyof typeof KEYS]) as number
			}
		});
		page.bool = [
			'SETTING_CHK_DELETE_YPK',
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
			}
		});
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
			:deep(.var-cell__extra) {
				display: flex;
				height: 40px;
				.result {
					width: 200px;
					position: relative;
					display: flex;
					justify-content: right;
					align-items: center;
				}
			}
		}
	}
</style>