<template>
	<div class = 'more no-scrollbar' v-if = '!i18n'>
		<var-cell
			v-for = 'i in  page.list'
			:title = 'i.title'
			:description = 'i.desc'
		>
			<template #icon>
				<img :src = 'i.src'/>
			</template>
			<template #extra>
				<Button
					v-if = 'i.btn'
					:content = 'i.btn'
					@click = 'i.click'
				/>
			</template>
		</var-cell>
		<var-divider :description = 'mainGame.get.text(I18N_KEYS.SETTING_ACKNOWLEDGEMENT)'/>
		<var-cell
			v-for = 'i in  page.acknowledgement'
			:title = 'i.title'
			:description = 'i.desc'
		>
			<template #icon>
				<img :src = 'i.src'/>
			</template>
			<template #extra>
				<Button
					v-if = 'i.btn'
					:content = 'i.btn'
					@click = 'i.click'
				/>
			</template>
		</var-cell>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import * as Opener from '@tauri-apps/plugin-opener';

	import mainGame from '@/script/game';
	import { URL } from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import invoke from '@/script/invoke';

	import Button from '@/pages/ui/button.vue';

	type List = Array<{
		title : string;
		desc : string;
		src : string;
		btn ?: string;
		click ?: () => Promise<void>;
	}>;

	const page = reactive({
		list : [
			{
				title : 'YGOPro3',
				desc : mainGame.get.text(I18N_KEYS.SETTING_GAME_CURRENT_VERSION, mainGame.version),
				src : './pics/ygopro3.webp',
				btn : mainGame.get.text(I18N_KEYS.SETTING_GOTO_GIT),
				click : async () => {
					try {
						await Opener.openUrl(URL.GIT_HOME);
					} catch (e) {
						await invoke.log.write(e);
					}
				}
			}, {
				title : '今晚有宵夜吗',
				desc : mainGame.get.text(I18N_KEYS.SETTING_AUTHOR_DESCRIPTION),
				src : './pics/xiaoye.webp',
				btn : mainGame.get.text(I18N_KEYS.SETTING_GOTO_HOME),
				click : async () => {
					try {
						await Opener.openUrl(URL.AUTHOR_HOME);
					} catch (e) {
						await invoke.log.write(e);
					}
				}
			}
		] as List,
		acknowledgement : [
			{
				title : '每日逃避tx追捕的可怜鼠鼠',
				desc : mainGame.get.text(I18N_KEYS.SETTING_CONTRIBUTOR_DESCRIPTION),
				src : './pics/rat.webp'
			}, {
				title : '幽影櫻',
				desc : mainGame.get.text(I18N_KEYS.SETTING_CONTRIBUTOR_DESCRIPTION),
				src : './pics/sakura.webp',
				btn : mainGame.get.text(I18N_KEYS.SETTING_GOTO_HOME),
				click : async () => {
					try {
						await Opener.openUrl(URL.HOME_OTHER.get('幽影櫻')!);
					} catch (e) {
						await invoke.log.write(e);
					}
				}
			}, {
				title : '乌鸦Producer',
				desc : mainGame.get.text(I18N_KEYS.SETTING_BGM_DESCRIPTION),
				src : './pics/producer.webp',
				btn : mainGame.get.text(I18N_KEYS.SETTING_GOTO_HOME),
				click : async () => {
					try {
						await Opener.openUrl(URL.HOME_OTHER.get('乌鸦Producer')!);
					} catch (e) {
						await invoke.log.write(e);
					}
				}
			},
		] as List
	});

	const props = defineProps<{
		i18n : boolean
	}>();
</script>
<style scoped lang = 'scss'>
	.more {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		> .var-cell {
			width: 100%;
			height: 100px;
			border-bottom: 1px solid white;
			[media = 'mobile'] & {
				--cell-description-font-size: 20px;
			}
			[media = 'pc'] & {
				--cell-font-size: 20px;
				--cell-description-font-size: 16px;
			}
			img {
				height: 90%;
			}
			:deep(.var-cell__content) {
				transform: translateX(20px);
			}
		}
	}
</style>