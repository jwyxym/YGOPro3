<template>
	<div
		class = 'expansions no-scrollbar'
		:style = "{ '--ct' : (page.versions.length + page.reload.length + 1).toString()}"
		v-if = '!i18n'
	>
		<var-cell
			v-for = "i in page.versions"
			:title = 'mainGame.get.text(i.title)'
		>
			<template #extra>
				<var-icon name = 'information-outline' v-if = 'i.loading === undefined' @click = 'i.chk'/>
				<var-loading color = 'white' v-else-if = "i.loading === 'loading'" class = 'setting__loading'/>
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
			:title = 'mainGame.get.text(i.title)'
		>
			<template #extra>
				<var-loading color = 'white' v-if = 'loading' class = 'setting__loading'/>
				<var-icon
					v-else
					name = 'refresh'
					@click = 'i.click'
				/>
			</template>
		</var-cell>
		<var-cell class = 'downloading-cell'>
			<template #default>
				<div class = 'downloading'>
					<div>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CUSTOM)'
							v-model = 'page.download.url'
							:rules = 'page.download.rule.url'
						/>
					</div>
					<div>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_NAME)'
							v-model = 'page.download.name'
							:rules = 'page.download.rule.name'
						/>
					</div>
					<div>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CHUNK)'
							v-model = 'page.download.chunk'
							:rules = 'page.download.rule.chunk'
						/>
					</div>
				</div>
			</template>
			<template #extra>
				<var-loading color = 'white' v-if = 'loading' class = 'setting__loading'/>
				<var-icon
					v-else
					name = 'arrow-down'
					@click = 'page.download.start()'
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
	import { all, create } from 'mathjs';

	import mainGame from '@/script/game';
	import invoke from '@/script/invoke';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS, REG, URL } from '@/script/constant';
	import { toast } from '@/pages/toast/toast';
	import dialog from '@/ui/dialog';
	import Input from '@/ui/input.vue';
	
	class Version {
		title : number;
		to_true ?: boolean;
		loading = ref<undefined | boolean | string>(undefined);
		chk : () => Promise<void>;
		update : () => Promise<void>;
		constructor (obj : {
			title : number,
			to_true ?: boolean,
			chk : () => Promise<boolean>,
			update : () => Promise<any>
		}) {
			this.title = obj.title;
			this.to_true = obj.to_true;
			this.chk = async () : Promise<void> => {
				this.loading.value = 'loading';
				this.loading.value = await obj.chk();
			};
			this.update = async () : Promise<void> => {
				const v = this.loading.value;
				this.loading.value = 'loading';
				const res = await obj.update() ?? true;
				this.loading.value = this.to_true ? Boolean(res) : v;
			};
		};
	}

	const math = create(all);

	const page = reactive({
		versions : [
			new Version({
				title : I18N_KEYS.SETTING_GAME_VERSION,
				chk : mainGame.chk.version.game,
				update : async () => await Opener.openUrl(URL.YGOPRO3_HOME)
			}),
			new Version({
				title : I18N_KEYS.SETTING_SUPER_PRE_VERSION,
				chk : mainGame.chk.version.superpre,
				update : async () : Promise<string> => {
					const ypk = await invoke.game.download(URL.SUPER_PRE, undefined, 1024 * 1024 * 10);
					if (ypk) {
						await page.change(ypk);
						if (!page.expansion.includes(ypk))
							page.expansion.push(ypk);
					}
					return ypk;
				},
				to_true : true
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
				const [res] = await Promise.all([
					invoke.ypk.load(value),
					mainGame.set.system(KEYS.SETTING_LOADING_EXPANSION, expansions, true)
				]);
				if (res && v === undefined)
					page.loaded_expansion.push(value);
			} else {
				const ct = expansions.indexOf(page.expansion[v!]);
				if (ct > -1)
					expansions.splice(ct, 1);
				await Promise.all([
					mainGame.unload.ypk(page.expansion[v!]),
					mainGame.set.system(KEYS.SETTING_LOADING_EXPANSION, expansions, true)
				]);
			}
			await mainGame.reload();
		},
		download : {
			name : '',
			url : '',
			chunk : '',
			rule : {
				name : (name ?: string) : string | true => {
					if (name === undefined || name.length === 0)
						return true;
					if (name.match(REG.NAME))
						return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
					return true;
				},
				url : (url ?: string) : string | true => {
					if (url === undefined || url.length === 0)
						return true;
					if (!url.startsWith('http'))
						return mainGame.get.text(I18N_KEYS.RULE_URL_UNLAWFUL);
					return true;
				},
				chunk : (chunk ?: string) : string | true => {
					if (chunk === undefined || chunk.length === 0)
						return true;
					try {
						const i = math.evaluate(chunk);
						if (i < 0)
							return mainGame.get.text(I18N_KEYS.RULE_CHUNK_NEGATIVE);
					} catch {
						return mainGame.get.text(I18N_KEYS.RULE_CHUNK_UNLAWFUL);
					}
					return true;
				}
			},
			start : async function () {
				const name = this.name;
				const url = this.url;
				const chunk = this.chunk;
				if (url.startsWith('http')
					&& typeof this.rule.name(name) === 'boolean'
					&& typeof this.rule.chunk(chunk) === 'boolean') {
					this.name = '';
					this.url = '';
					const ypk = await invoke.game.download(url, name, math.evaluate(chunk));
					if (ypk) {
						await page.change(ypk);
						if (!page.expansion.includes(ypk))
							page.expansion.push(ypk);
					}
				}
			}
		}
	});

	onBeforeMount(async () => {
		page.expansion = await invoke.ypk.load() as Array<string>;
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
		overflow-y: auto;
		[media = 'mobile'] & {
			:deep(.setting__loading){
				gap: 150px !important;
			}
			> .downloading-cell {
				height: 280px !important;
			}
		}
		.var-cell {
			.downloading {
				width: 750px;
				display: flex;
				flex-direction: column;
				> div {
					height: 80px;
					width: 100%;
					.var-input {
						width: 350px;
					}
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