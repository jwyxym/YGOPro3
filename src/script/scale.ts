import { reactive } from 'vue';

const resize = () => {
	const height = window.innerHeight;
	const width = window.innerWidth;
	GLOBAL.SCALE = height / width < GLOBAL.HEIGHT / GLOBAL.WIDTH ? height / GLOBAL.HEIGHT
		: width / GLOBAL.WIDTH;
	GLOBAL.LEFT = (width - GLOBAL.WIDTH * GLOBAL.SCALE) / 2;
	GLOBAL.TOP = (height - GLOBAL.HEIGHT * GLOBAL.SCALE) / 2;
	document.documentElement.style.setProperty('--scale', `${GLOBAL.SCALE}`);
	document.documentElement.style.setProperty('--height', `${GLOBAL.HEIGHT}px`);
	document.documentElement.style.setProperty('--width', `${GLOBAL.WIDTH}px`);
	document.documentElement.style.setProperty('--left', `${GLOBAL.LEFT}px`);
	document.documentElement.style.setProperty('--top', `${GLOBAL.TOP}px`);
};

const GLOBAL = reactive({
	HEIGHT : 900,
	WIDTH : 1600,
	LEFT : 0,
	TOP : 0,
	SCALE : 1
});

window.addEventListener('resize', resize);
resize();

export default GLOBAL;