import dialog from '@/ui/dialog';
import mainGame from './game';
import { I18N_KEYS } from './language/i18n';
import GLOBAL from './scale';

const landscape = {
	to : async () => {
		if (!__WEB__
			|| GLOBAL.CURRENT.WIDTH > GLOBAL.CURRENT.HEIGHT
			|| !window.matchMedia('(pointer: coarse) and (hover: none)').matches
		)
			return;

		const orientation = screen.orientation as ScreenOrientation & {
			lock?: (direction: 'landscape') => Promise<void>;
		};

		if (!orientation?.lock)
			return;

		if (!document.fullscreenElement) {
			await dialog({
				title : mainGame.get.text(I18N_KEYS.START_LANDSCAPE),
				closeOnClickOverlay : false,
				cancelButton : false
			}, true);
		}
			await document.documentElement.requestFullscreen();

		await orientation.lock('landscape');
	},
	exit : async () => {
		screen.orientation?.unlock?.();

		if (document.fullscreenElement)
			await document.exitFullscreen();
	}
};

export default landscape;