import { Dialog, DialogOptions } from '@varlet/ui'
import mainGame from '@/script/game';
import * as CONSTANT from '@/script/constant';
import { I18N_KEYS } from '@/script/language/i18n';

const dialog = async (option : DialogOptions, need_confirm : boolean | number | Array<string> | string = true) : Promise<void> => {
	let resolve = undefined as (() => void) | undefined;
	const chk = mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_SWAP_BUTTON);
	option.dialogClass = 'dialog';
	option.cancelButtonTextColor = 'white';
	option.confirmButtonTextColor = 'white';
	const cancel_text = option.cancelButtonText ?? mainGame.get.text(I18N_KEYS.CONFIRM).value;
	const confirm_text = option.confirmButtonText ?? mainGame.get.text(I18N_KEYS.CANCEL).value;
	option.cancelButtonText = chk ? cancel_text : confirm_text;
	option.confirmButtonText = chk ? confirm_text : cancel_text;
	const confirm = option.onConfirm;
	const cancel = option.onCancel;
	const on_close = option.onClose;
	const close = async () => {
		if (on_close !== undefined)
			await on_close();
		if (resolve !== undefined)
			resolve();
	}
	option.onConfirm = chk ? cancel : confirm;
	option.onCancel = chk ? confirm : cancel;
	option.onClose = close;
	const quit = async () : Promise<void> => {
		if (confirm !== undefined)
			await confirm();
		if (close !== undefined)
			await close();
	};
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	need_confirm ? await Dialog(option) : await quit();
	await promise;
}

export default dialog;