import { createApp } from 'vue';
import YGO from './init.vue';
import VueCssStarrySky from 'vue-css-starry-sky';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style.mjs';
import { FakeQQUI } from 'fake-qq-ui';
import 'fake-qq-ui/styles/fake-qq-ui.css';
import 'fake-qq-ui/styles/light.scss';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import 'highlight.js/styles/github-dark.css';
import 'shinycard/style.css';
import '@jwyxym/dice/style.css';

createApp(YGO)
	.use(VueCssStarrySky)
	.use(Varlet)
	.use(FakeQQUI)
	.mount('#ygopro');

if (!import.meta.env.DEV) {
	document.addEventListener('keydown', (e : KeyboardEvent) : void => {
		if (e.key === 'F5') {
			e.preventDefault();
			e.stopPropagation();
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
			e.preventDefault();
			e.stopPropagation();
		}
	});
	document.addEventListener('contextmenu', (e : MouseEvent) : void => {
		e.preventDefault();
	});
}
