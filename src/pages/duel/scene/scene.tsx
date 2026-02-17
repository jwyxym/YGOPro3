import { defineComponent, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import mainGame from '@/script/game';
import { FILES } from '@/script/constant';
import * as CONSTANT from './constant';
import Axis from './axis';
import Plaid from './plaid';
import GLOBAL from '@/script/global';
import Btn from './btn';

class Duel {
	element : HTMLDivElement | null = null;
	set_element = (el : HTMLDivElement | null) => this.element = el;
	
	renderer : CSS.CSS3DRenderer = new CSS.CSS3DRenderer();
	scene : THREE.Scene = new THREE.Scene();
	camera : THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
	plaids : Array<Plaid> = [];
	btn : Btn | null = null;
	animation_id : number = 0;

	animate = () => {
		this.animation_id = requestAnimationFrame(this.animate);
		this.renderer.render(this.scene, this.camera);
	};

	init = () => {
		if (!this.element)
			return;
		Object.assign(this.renderer.domElement.style, {
			opacity : '0',
			transition : 'all 0.5s ease'
		});
		this.renderer.setSize(GLOBAL.WIDTH + (400 - GLOBAL.LEFT) * 2, GLOBAL.HEIGHT);
		this.camera.position.set(0, -300, 630);
		this.camera.lookAt(0, -60, 0);

		this.add.back();
		this.add.btn();
		for (let x = -3; x < 4; x++)
			for (let y = -2; y < 3; y++)
				if (y !== 0 || x % 2 !== 0)
    				this.add.plaid(x, y);

		this.scene.add(new THREE.AmbientLight('white', 1));
		this.element!.appendChild(this.renderer.domElement);
		this.animate();
		this.renderer.domElement.style.opacity = '1';
	};
	clear = () => {
		cancelAnimationFrame(this.animation_id);
		this.renderer = new CSS.CSS3DRenderer();
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera();
		this.plaids.length = 0;
		this.btn = null;
	};
	add = {
		back : (pic : Array<string | undefined> = mainGame.get.textures(FILES.TEXTURE_BACK) as Array<string>) : void => {
			const create_back = (srcs : Array<string> = []) : CSS.CSS3DObject => {
				const dom = document.createElement('div');
				dom.style.width = `${CONSTANT.WIDTH * 12}px`;
				for (const [v, src] of srcs.entries()) {
					const child = document.createElement('img');
					child.src = src;
					Object.assign(child.style, {
						display : 'block',
						width : `${CONSTANT.WIDTH * 12}px`,
						height : `${CONSTANT.HEIGHT * 4}px`,
						transform : !!v ? 'initial' : 'scaleY(-1)'
					});
					dom.appendChild(child);
				}
				return new CSS.CSS3DObject(dom);
			};
			const back = create_back(pic.filter(i => i !== undefined));
			back.position.set(...Axis.computed.back(new Axis(0, 0, 0)).get.xyz());
			this.scene.add(back);
		},
		plaid : (x : number, y : number) : void => {
			const plaid = new Plaid(x, y)
			plaid.three.position.set(...Axis.computed.back(new Axis(x, y, 0)).get.xyz());
			this.scene.add(plaid.three);
			this.plaids.push(plaid);
		},
		btn : () : void => {
			const btn = new Btn();
			btn.three.position.set(...Axis.computed.back(new Axis(2, 0, 0)).get.xyz());
			this.scene.add(btn.three);
			this.btn = btn;
		}
	}
};

const duel = new Duel();

const _Duel = defineComponent({
	name : 'Duel',
	setup () {
		onMounted(duel.init);
		onUnmounted(duel.clear);
		return () => <div ref = {(el) => duel.set_element(el as HTMLDivElement | null)}/>;
	},
});

export default _Duel;