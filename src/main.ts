import { createApp } from 'vue';
import YGO from './init.vue';
import Vue3StarrySky from 'vue3-starry-sky';
import 'vue3-starry-sky/lib/style.css';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style.mjs';
import { FakeQQUI } from 'fake-qq-ui';
import 'fake-qq-ui/styles/fake-qq-ui.css';
import 'fake-qq-ui/styles/light.scss';

const ygopro = createApp(YGO);

ygopro.use(Vue3StarrySky);
ygopro.use(Varlet);
ygopro.use(FakeQQUI)

ygopro.mount('#ygopro');

document.addEventListener('keydown', (e : KeyboardEvent) : void => {
	if (!import.meta.env.DEV)
		if (e.key === 'F5') {
			e.preventDefault();
			e.stopPropagation();
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
			e.preventDefault();
			e.stopPropagation();
		}
});
document.addEventListener('contextmenu', (e : MouseEvent) : void => {
	if (!import.meta.env.DEV)
		e.preventDefault();
});