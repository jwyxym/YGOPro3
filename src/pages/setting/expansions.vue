<template>
	<div
		class = 'expansions'
		:style = "{ '--ct' : (page.versions.length + page.reload.length + 1).toString()}"
		v-if = '!i18n'
	>
		<var-cell
			v-for = "i in page.versions"
			:border = 'true'
			:title = 'mainGame.get.text(i.title)'
		>
			<template #extra>
				<var-icon name = 'information-outline' v-if = 'i.loading === undefined' @click = 'i.chk'/>
				<var-loading color = 'white' v-else-if = "i.loading === 'loading'"/>
				<div
					class = 'result'
					v-show = "typeof i.loading === 'boolean'"
					@click = 'i.update'
				>
					<span>{{ mainGame.get.text(i.loading ? I18N_KEYS.SETTING_LATEST : I18N_KEYS.SETTING_UPDATE) }}</span>
					<var-badge color = 'chartreuse' dot v-if = 'i.loading'/>
					<var-badge type = 'danger' dot v-else/>
				</div>
			</template>
		</var-cell>
		<var-cell
			v-for = "i in page.reload"
			:border = 'true'
			:title = 'mainGame.get.text(i.title)'
		>
			<template #extra>
				<var-loading color = 'white' v-if = 'loading'/>
				<var-icon
					v-else
					name = 'refresh'
					@click = 'i.click'
				/>
			</template>
		</var-cell>
		<var-cell
			:border = 'true'
		>
			<template #default>
				<div class = 'downloading'>
					<Input
						:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CUSTOM)'
						v-model = 'page.download.url'
						:rules = 'page.download.url_rule'
					/>
					<Input
						:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_NAME)'
						v-model = 'page.download.name'
						:rules = 'page.download.name_rule'
					/>
				</div>
			</template>
			<template #extra>
				<var-loading color = 'white' v-if = 'loading'/>
				<var-icon
					v-else
					name = 'arrow-down'
					@click = 'page.download.start'
				/>
			</template>
		</var-cell>
		<var-divider :description = 'mainGame.get.text(I18N_KEYS.SETTING_EX_CARDS)'/>
		<var-checkbox-group v-model = 'page.loaded_expansion'>
			<var-loading :loading = 'loading'>
				<TransitionGroup
					name = 'opacity'
					tag = 'div'
					class = 'no-scrollbar'
				>
					<var-cell
						v-for = '(i, v) in page.expansion'
						:key = 'i'
						:title = 'i'
						:border = 'true'
						@dblclick = 'page.delete(v)'
					>
						<template #extra>
							<var-checkbox
								:checked-value = 'i'
								@change = 'page.change($event, v)'
							></var-checkbox>
							<var-icon name = 'trash-can-outline' @click = 'page.delete(v)'/>
						</template>
					</var-cell>
				</TransitionGroup>
			</var-loading>
		</var-checkbox-group>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive, ref } from 'vue';
	import * as Opener from '@tauri-apps/plugin-opener';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import fs from '@/script/fs';
	import { KEYS, REG, URL } from '@/script/constant';
	import { toast } from '@/pages/toast/toast';
	import dialog from '@/pages/ui/dialog';
	import Input from '@/pages/ui/input.vue';
	
	class Version {
		title : number;
		loading = ref<undefined | boolean | string>(undefined);
		chk : () => Promise<void>;
		update : () => Promise<void>;
		constructor (obj : {
			title : number,
			chk : () => Promise<boolean>,
			update : () => Promise<any>
		}) {
			this.title = obj.title;
			this.chk = async () : Promise<void> => {
				this.loading.value = 'loading';
				this.loading.value = await obj.chk();
			};
			this.update = async () : Promise<void> => {
				this.loading.value = 'loading';
				await obj.update();
				this.loading.value = true;
			};
		};
		
	}
	const page = reactive({
		versions : [
			new Version({
				title : I18N_KEYS.SETTING_GAME_VERSION,
				chk : mainGame.chk.version.game,
				update : async () => await Opener.openUrl(URL.YGOPRO3)
			}),
			new Version({
				title : I18N_KEYS.SETTING_ASSETS_VERSION,
				chk : mainGame.chk.version.assets,
				update : mainGame.update
			}),
			new Version({
				title : I18N_KEYS.SETTING_SUPER_PRE_VERSION,
				chk : mainGame.chk.version.superpre,
				update : async () => await mainGame.download(URL.SUPER_PRE)
			}),
		],
		reload : [
			{ title : I18N_KEYS.SETTING_RESERT, click : async () => await mainGame.reload(true) },
			{ title : I18N_KEYS.SETTING_RELOAD, click :  async () => await mainGame.reload() },
		],
		expansion : [] as Array<string>,
		loaded_expansion : [] as Array<string>,
		delete : async (v : number) => {
			if (await dialog({
					title : mainGame.get.text(I18N_KEYS.SETTING_DELETE_YPK),
				}, mainGame.get.system(KEYS.SETTING_CHK_DELETE_YPK))
				&& await mainGame.unload.ypk(page.expansion[v], true)
			) {
				const expansions = (mainGame.get.system(KEYS.SETTING_LOADING_EXPANSION) as Array<string>);
				const ct = expansions.indexOf(page.expansion[v]);
				if (ct > -1)
					expansions.splice(ct, 1);
				page.expansion.splice(v, 1);
				toast.info(mainGame.get.text(I18N_KEYS.DELETE_COMPELETE))
			}
		},
		change : async (value : string | boolean, v ?: number) : Promise<void> => {
			const expansions = (mainGame.get.system(KEYS.SETTING_LOADING_EXPANSION)! as Array<string>);
			if (typeof value === 'string') {
				if (!expansions.includes(value))
					expansions.push(value);
				await Promise.all([
					mainGame.load.ypk(value),
					mainGame.set.system(KEYS.SETTING_LOADING_EXPANSION, expansions)
				]);
			} else {
				const ct = expansions.indexOf(page.expansion[v!]);
				if (ct > -1)
					expansions.splice(ct, 1);
				await Promise.all([
					mainGame.unload.ypk(page.expansion[v!]),
					mainGame.set.system(KEYS.SETTING_LOADING_EXPANSION, expansions)
				]);
			}
			await mainGame.reload();
		},
		download : {
			name : '',
			url : '',
			start : async () => {
				const name = page.download.name;
				const url = page.download.url;
				if (url.startsWith('http')
					&& typeof page.download.name_rule(name) === 'boolean') {
					page.download.name = '';
					page.download.url = '';
					const ypk = await mainGame.download(url, name);
					if (ypk) {
						await page.change(ypk);
						if (!page.expansion.includes(ypk))
							page.expansion.push(ypk);
					}
				}
			},
			name_rule : (name ?: string) : string | true => {
				if (name === undefined || name.length === 0)
					return true;
				if (name.match(REG.NAME))
					return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
				return true;
			},
			url_rule : (url ?: string) : string | true => {
				if (url === undefined || url.length === 0)
					return true;
				if (!url.startsWith('http'))
					return mainGame.get.text(I18N_KEYS.RULE_URL_UNLAWFUL);
				return true;
			}
		}
	});

	onBeforeMount(async () => {
		page.expansion = await fs.read.dir('expansions', ['ypk', 'zip']);
		page.loaded_expansion = mainGame.get.system(KEYS.SETTING_LOADING_EXPANSION) as Array<string>;
	});

	const props = defineProps<{
		loading : boolean,
		i18n : boolean
	}>();
</script>
<style scoped lang = 'scss'>
	.expansions {
		height: 100%;
		width: 100%;
		.var-cell {
			.downloading {
				height: 80px;
				width: 800px;
				display: flex;
				gap: 20px;
				align-items: center;
				.var-input {
					width: 350px;
				}
			}
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
		.var-checkbox-group {
			height: calc(100% - 50px * (var(--ct) + 3));
			width: 100%;
			> div {
				height: 100%;
				width: 100%;
				> div {
					height: 100%;
					width: 100%;
					overflow-y: auto;
					> div {
						width: calc(100% - 20px);
					}
				}
			}
		}
	}
</style>