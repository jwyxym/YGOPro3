import { Dialog, DialogOptions } from '@varlet/ui'
import mainGame from '@/script/game';
import * as CONSTANT from '@/script/constant';
import { I18N_KEYS } from '@/script/language/i18n';

let resolve = undefined as ((value: boolean | PromiseLike<boolean>) => void) | undefined;

const dialog = async (option : DialogOptions, need_confirm : boolean | number | Array<string> | string = true) : Promise<boolean> => {
	if (need_confirm) {
		const chk = mainGame.get.system(CONSTANT.KEYS.SETTING_CHK_SWAP_BUTTON);
		option.dialogClass = 'dialog';
		option.cancelButtonTextColor = 'white';
		option.confirmButtonTextColor = 'white';
		const cancel_text = option.cancelButtonText ?? mainGame.get.text(I18N_KEYS.CONFIRM);
		const confirm_text = option.confirmButtonText ?? mainGame.get.text(I18N_KEYS.CANCEL);
		option.cancelButtonText = chk ? cancel_text : confirm_text;
		option.confirmButtonText = chk ? confirm_text : cancel_text;
		const confirm = () => resolve?.(true);
		const cancel = () => resolve?.(false);
		option.onConfirm = chk ? cancel : confirm;
		option.onCancel = chk ? confirm : cancel;
		const promise = new Promise<boolean>((r) => resolve = r);
		await Dialog(option);
		return promise;
	} else
		return true;
}

const close = () : void => resolve?.(false) || Dialog.close();

export default dialog;
export { close };