<template>
	<var-popup
		v-model:show = 'page.show'
		:close-on-key-escape = 'false'
		:close-on-click-overlay = 'false'
		@click-overlay = 'page.exit'
		@key-escape = 'page.exit'
	>
		<var-loading
			:loading = 'page.loading'
			color = 'white'
			class = 'setting'
		>
			<var-tabs v-model:active = "page.select">
				<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_PACKS) }}</var-tab>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_ITEMS) }}</var-tab>
				<var-tab>{{ mainGame.get.text(I18N_KEYS.SETTING_OTHER) }}</var-tab>
			</var-tabs>
			<transition name = 'opacity'>
				<div class = 'expansions' v-if = 'page.select === 0'>
					<var-cell
						:title = 'mainGame.get.text(I18N_KEYS.SETTING_GAME_VERSION)'
						:border = 'true'
					>
						<template #extra>
							<var-icon name = 'information-outline' v-show = 'expansion.version.game.loading === undefined' @click = 'expansion.version.game.chk'/>
							<var-loading color = 'white' v-show = "expansion.version.game.loading === 'loading'"/>
							<div
								class = 'result'
								v-show = "typeof expansion.version.game.loading === 'boolean'"
								@click = 'expansion.version.game.update'
							>
								<span>{{ mainGame.get.text(expansion.version.game.loading ? I18N_KEYS.SETTING_LATEST : I18N_KEYS.SETTING_UPDATE) }}</span>
								<var-badge type = 'danger' dot v-show = '!expansion.version.game.loading'/>
								<var-badge color = 'chartreuse' dot v-show = 'expansion.version.game.loading'/>
							</div>
						</template>
					</var-cell>
					<var-cell
						:title = 'mainGame.get.text(I18N_KEYS.SETTING_SUPER_PRE_VERSION)'
						:border = 'true'
					>
						<template #extra>
							<var-icon name = 'information-outline' v-show = 'expansion.version.superpre.loading === undefined' @click = 'expansion.version.superpre.chk'/>
							<var-loading color = 'white' v-show = "expansion.version.superpre.loading === 'loading'"/>
							<div
								class = 'result'
								v-show = "typeof expansion.version.superpre.loading === 'boolean'"
								@click = 'expansion.version.superpre.update'
							>
								<span>{{ mainGame.get.text(expansion.version.superpre.loading ? I18N_KEYS.SETTING_LATEST : I18N_KEYS.SETTING_UPDATE) }}</span>
								<var-badge type = 'danger' dot v-show = '!expansion.version.superpre.loading'/>
								<var-badge color = 'chartreuse' dot v-show = 'expansion.version.superpre.loading'/>
							</div>
						</template>
					</var-cell>
					<var-cell
						:border = 'true'
						:title = 'mainGame.get.text(I18N_KEYS.SETTING_RESERT)'
					>
						<template #extra>
							<var-icon
								name = 'refresh'
								@click = 'async () => { await expansion.resert() }'
							/>
						</template>
					</var-cell>
					<var-cell
						:border = 'true'
						:title = 'mainGame.get.text(I18N_KEYS.SETTING_RELOAD)'
					>
						<template #extra>
							<var-icon
								name = 'refresh'
								@click = 'expansion.reload'
							/>
						</template>
					</var-cell>
					<var-cell
						:border = 'true'
						:title = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CUSTOM)'
					>
						<template #extra>
							<var-icon
								name = 'download-outline'
								@click = 'download.popup.on'
							/>
						</template>
					</var-cell>
					<var-divider :description = 'mainGame.get.text(I18N_KEYS.SETTING_EX_CARDS)'/>
					<var-checkbox-group v-model = 'setting.load'>
						<var-list>
							<TransitionGroup
								name = 'opacity'
								tag = 'div'
							>
								<var-cell
									v-for = '(i, v) in setting.expansion'
									:key = 'i'
									:title = 'i'
									:border = 'true'
									@dblclick = 'expansion.delete(v)'
								>
									<template #extra>
										<var-checkbox
											:checked-value = 'i'
											@change = 'expansion.change($event, v)'
										></var-checkbox>
										<var-icon name = 'trash-can-outline' @click = 'expansion.delete(v)'/>
									</template>
								</var-cell>
							</TransitionGroup>
						</var-list>
					</var-checkbox-group>
				</div>
			</transition>
			<transition name = 'opacity'>
				<div class = 'items' v-if = 'page.select === 1'>
					<var-cell
						:border = 'true'
					>
						<template #default>
							<div>
								{{ `${mainGame.get.text(I18N_KEYS.SETTING_VOICE_BACK_BGM)} : ${setting.sound.toFixed(2)}` }}
								<var-slider
									v-if = 'mainGame.get.system(CONSTANT.KEYS.SETTING_SELECT_SORT) === 1'
									v-model = 'setting.sound'
									label-visible = 'never'
									:step = '0.01'
									:max = '1'
									:min = '0'
									@end = 'items.sound_change_over'
								/>
								<slider
									v-if = 'mainGame.get.system(CONSTANT.KEYS.SETTING_SELECT_SORT) === 0'
									v-model = 'setting.sound'
									color = '#397bfe'
									track-color = 'white'
									:step = '0.01'
									:max = '1'
									:min = '0'
									@drag-end = 'items.sound_change_over'
								/>
							</div>
						</template>
					</var-cell>
					<var-checkbox-group v-model = 'setting.items.chk'>
						<var-list>
							<var-cell
								v-for = 'i in setting.items.all'
								:key = 'i'
								:title = 'mainGame.get.text(I18N_KEYS[i[0]])'
								:border = 'true'
							>
								<template #extra>
									<var-checkbox
										:checked-value = 'i'
										@change = 'items.change($event, i[1])'
									></var-checkbox>
								</template>
							</var-cell>
						</var-list>
					</var-checkbox-group>
					<var-list>
						<var-cell
							v-for = 'i in setting.counts'
							:key = 'i'
							:title = 'mainGame.get.text(I18N_KEYS[i.key[0]])'
							:border = 'true'
						>
							<template #extra>
								<Input
									:variant = 'false'
									placeholder = ''
									type = 'number'
									v-model = 'i.value'
									@blur = 'items.change(i.value, i.key[1])'
								/>
							</template>
						</var-cell>
					</var-list>
				</div>
			</transition>
		</var-loading>
		<var-popup :close-on-key-escape = 'false' v-model:show = 'download.popup.url' position = 'center' :close-on-click-overlay = 'false'>
			<var-form class = 'download_custom'>
				<Input
					:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CUSTOM)'
					v-model = 'download.url'
				/>
				<Input
					:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_NAME)'
					:rules = 'download.name_rule'
					v-model = 'download.name'
				/>
				<TransitionGroup tag = 'div' name = 'opacity' class = 'buttons'>
					<Button_List
						:loading = 'download.chk'
						:confirm = 'download.custom.confirm'
						:cancel = 'download.custom.cancel'
						v-show = 'download.size < 0'
						:key = '0'
					/>
					<div
						:key = '1'
						v-show = 'download.size === 0'
					>
						{{ mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_PROGRESS) }}&nbsp;
						{{ (download.progress / (1024 * 1024)).toFixed(2) }}
						MB
					</div>
					<div
						:key = '2'
						v-show = 'download.size > 0'
					>
						{{ mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_PROGRESS) }}&nbsp;
						{{ Math.min((download.progress / download.size) * 100, 99.99).toFixed(2) }}
						%
					</div>
				</TransitionGroup>
			</var-form>
		</var-popup>
	</var-popup>
</template>
<script setup lang = 'ts'>
	import { reactive, onBeforeMount, onMounted, watch, TransitionGroup } from 'vue';
	import slider from 'vue3-slider';
	
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import * as CONSTANT from '@/script/constant';
	import fs from '@/script/fs';
	import listen from '@/script/tauri-api/listen';
	import { toast } from '@/pages/toast/toast';

	import Dialog from '@/pages/ui/dialog';
	import Input from '@/pages/ui/input.vue';
	import Button_List from '@/pages/ui/button_list.vue';

	const page = reactive({
		show : false,
		select : 0,
		loading : false,
		exit : () => {
			if (page.loading || expansion.version.game.loading === 'loading' || expansion.version.superpre.loading === 'loading')
				page.show = true;
			else page.show = false;
		}
	});

	const setting = reactive({
		load : [] as Array<string>,
		expansion : [] as Array<string>,
		items : {
			all : [] as Array<[keyof typeof I18N_KEYS, string]>,
			chk : [] as Array<[keyof typeof I18N_KEYS, string]>
		},
		sound : 0,
		counts : [] as Array<{
			key : [keyof typeof I18N_KEYS, string];
			value : string
		}>,
	})

	const download = reactive({
		size : -1,
		progress : 0,
		now : 0,
		chk : false,
		url : '',
		name : '',
		name_rule : (name : string | undefined) : string | boolean => {
			if (name !== undefined && name.length > 0 && name.match(CONSTANT.REG.NAME))
				return mainGame.get.text(I18N_KEYS.SETTING_RULE_NAME_UNLAWFUL);
			return true;
		},
		popup : {
			url : false,
			on : async () : Promise<void> => {
				download.popup.url = true;
			}
		},
		on : async (url : string, name : string = '') : Promise<boolean> => {
			if (!url) {
				toast.error(mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_LEN));
				return false;
			}
			download.chk = true;
			toast.info(mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_START));
			const start = await listen.download.start((i : number) => {
				download.size = i;
			});
			const progress = await listen.download.progress((i : number) => {
				download.progress += i;
			});
			const path = await fs.write.ypk(url, name);
			start();
			progress();
			if (path.length == 2) {
				mainGame.push.system(CONSTANT.KEYS.SETTING_LOADING_EXPANSION, path[1]);
				const load = await mainGame.get.expansions();
				setting.expansion = load.ypk.map(i => i.name);
				if (!setting.load.includes(path[1]) && setting.expansion.includes(path[1]))
					setting.load.push(path[1]);
				await mainGame.load.ypk(path[0]);
				await fs.write.system();
				toast.info(mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_COMPELETE));
			}
			download.chk = false;
			
			setTimeout(() => {
				download.size = -1;
				download.progress = 0;
			}, 200);
			return path.length == 2;
		},
		custom : {
			confirm : async () : Promise<void> => {
				await download.on(download.url, download.name ?? '');
				download.custom.exit();
			},
			cancel : () : void => {
				download.custom.exit();
			},
			exit : () : void => {
				download.popup.url = false;
				download.url = '';
				download.name = '';
			}
		}
	});

	const expansion = reactive({
		delete : async (v : number) : Promise<void> => {
			await Dialog({
				title : mainGame.get.text(I18N_KEYS.SETTING_DELETE_YPK),
				onConfirm : async () : Promise<void> => {
					if (await fs.delete.ypk(setting.expansion[v])) {
						const load = await mainGame.get.expansions();
						setting.expansion = load.ypk.map(i => i.name);
						toast.info(mainGame.get.text(I18N_KEYS.SETTING_DELETE_YPK))
					}
				}
			}, mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_DELETE_YPK));
		},
		change : async (value : string | boolean, v : number) : Promise<void> => {
			page.loading = true;
			const load = await mainGame.get.expansions();
			setting.expansion = load.ypk.map(i => i.name);
			if (typeof value === 'string') {
				mainGame.push.system(CONSTANT.KEYS.SETTING_LOADING_EXPANSION, value);
				await mainGame.load.ypk(await fs.join(CONSTANT.DIRS.EXPANSION, value));
				await fs.write.system();
			} else {
				mainGame.remove.system(CONSTANT.KEYS.SETTING_LOADING_EXPANSION, setting.expansion[v]);
				await fs.write.system();
				await mainGame.reload();
			}
			page.loading = false;
		},
		reload : async () : Promise<void> => {
			page.loading = true;
			await mainGame.reload();
			page.loading = false;
		},
		resert : async (chk : boolean = false) : Promise<boolean> => {
			page.loading = true;
			let result = false;
			if (await fs.init(true, chk))
				result = await mainGame.reload();
			page.loading = false;
			return result;
		},
		version : {
			game : {
				chk : async () : Promise<void> => {
					expansion.version.game.loading = 'loading';
					expansion.version.game.loading = await mainGame.chk.version.game();
				},
				update : async () : Promise<void> => {
					if (expansion.version.game.loading)
						return;
					expansion.version.game.loading = 'loading';
					expansion.version.game.loading = await expansion.resert(true);
				},
				loading : undefined as undefined | boolean | string
			},
			superpre : {
				chk : async () : Promise<void> => {
					expansion.version.superpre.loading = 'loading';
					const chk = await mainGame.chk.version.superpre();
					expansion.version.superpre.loading = chk;
				},
				update : async () : Promise<void> => {
					if (expansion.version.superpre.loading)
						return;
					expansion.version.superpre.loading = 'loading';
					expansion.version.superpre.loading = await download.on(CONSTANT.URL.SUPER_PRE);
				},
				loading : undefined as undefined | boolean | string
			}
		},
	});

	const items = {
		change : async (value : Array<string> | string | boolean, i : string) : Promise<void> => {
			mainGame.push.system(i, i.startsWith('SETTING_CHK_') ? typeof value !== 'boolean' : value as string);
			await fs.write.system();
		},
		sound_change : async (value : number) : Promise<void> => {
			mainGame.push.system(CONSTANT.KEYS.SETTING_VOICE_BACK_BGM, value.toFixed(2));
		},
		sound_change_over : async () : Promise<void> => {
			page.loading = true;
			await fs.write.system();
			page.loading = false;
		}
	};

	onBeforeMount(async () : Promise<void> => {
		const load = await mainGame.get.expansions();
		setting.expansion = load.ypk.map(i => i.name);
		setting.load = (mainGame.get.system(CONSTANT.KEYS.SETTING_LOADING_EXPANSION) as Array<string> | undefined) ?? [];
		const items = Object.entries(CONSTANT.KEYS).filter(i => i[0].startsWith('SETTING_CHK_'));
		setting.items.all = items as Array<[keyof typeof I18N_KEYS, string]>;
		setting.items.chk = setting.items.all.filter(i => mainGame.get.system(i[1]));
		const cts = Object.entries(CONSTANT.KEYS).filter(i => i[0].startsWith('SETTING_CT_'));
		setting.counts = (cts as Array<[keyof typeof I18N_KEYS, string]>).map(i => {
			return {
				key : i,
				value : (mainGame.get.system(i[1]) as number).toString()
			}
		});
		setting.sound = mainGame.get.system(CONSTANT.KEYS.SETTING_VOICE_BACK_BGM) as number;
	});

	onMounted(() => {
		page.show = true;
	})

	watch(() => { return setting.sound; }, async (n) => {
		await items.sound_change(n);
	});

	watch(() => { return page.show; }, (n) => {
		if (!n)
			setTimeout(props.select.menu, 200);
	});
	
	const props = defineProps(['select']);
</script>
<style scoped lang = 'scss'>
	@use './setting.scss';
</style>