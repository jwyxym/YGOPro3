import { createApp } from 'vue';
import TauriYGO from './tauri-ygo.vue';
import Vue3StarrySky from 'vue3-starry-sky';
import 'vue3-starry-sky/lib/style.css';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style';

const ygopro = createApp(TauriYGO);

ygopro.use(Vue3StarrySky);
ygopro.use(Varlet);

ygopro.mount('#ygopro');

document.addEventListener('keydown', (e : KeyboardEvent) : void => {
	if (!import.meta.env.DEV)
		if (e.key === 'F5' || e.keyCode === 116) {
			e.preventDefault();
			e.stopPropagation();
		} else if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.keyCode === 82)) {
			e.preventDefault();
			e.stopPropagation();
		}
});
document.addEventListener('contextmenu', (e : MouseEvent) : void => {
	if (!import.meta.env.DEV)
		e.preventDefault();
});