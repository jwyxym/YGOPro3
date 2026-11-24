

import { reactive,  ref } from 'vue';

import { open } from '@/script/tauri';
import { KEYS, URL } from '@/script/constant';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';
import invoke from '@/script/invoke';

import { toast } from '@/pages/toast/toast';

import dialog from '@/ui/dialog';

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
};

const setting = reactive({
	versions : [
		new Version({
			title : I18N_KEYS.SETTING_GAME_VERSION,
			chk : mainGame.chk.version.game,
			update : async () => await open(URL.YGOPRO3_HOME)
		}),
		new Version({
			title : I18N_KEYS.SETTING_SUPER_PRE_VERSION,
			chk : mainGame.chk.version.superpre,
			update : async () : Promise<string> => {
				const ypk = await invoke.game.download(URL.SUPER_PRE);
				if (ypk) {
					await setting.change(ypk);
					if (!setting.expansion.includes(ypk))
						setting.expansion.push(ypk);
				}
				return ypk;
			},
			to_true : true
		}),
	],
	expansion : [] as Array<string>,
	loaded_expansion : [] as Array<string>,
	delete : async (v : number) => {
		if (await dialog({
				title : mainGame.get.text(I18N_KEYS.SETTING_DELETE_YPK),
			}, mainGame.get.system(KEYS.SETTING_CHK_DELETE_YPK))
			&& await mainGame.unload.ypk(setting.expansion[v], true)
		) {
			const expansions = (mainGame.get.system(KEYS.SETTING_LOADING_EXPANSION) as Array<string>);
			const ct = expansions.indexOf(setting.expansion[v]);
			if (ct > -1)
				expansions.splice(ct, 1);
			setting.expansion.splice(v, 1);
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
				setting.loaded_expansion.push(value);
		} else {
			const ct = expansions.indexOf(setting.expansion[v!]);
			if (ct > -1)
				expansions.splice(ct, 1);
			await Promise.all([
				mainGame.unload.ypk(setting.expansion[v!]),
				mainGame.set.system(KEYS.SETTING_LOADING_EXPANSION, expansions, true)
			]);
		}
		await mainGame.reload();
	}
});

export default setting;