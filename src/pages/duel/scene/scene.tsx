import { defineComponent, onMounted, onUnmounted, reactive } from 'vue';
import * as THREE from 'three';
import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';

import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import { COMMAND, LOCATION, POS } from '@/pages/duel/ygo-protocol/network';
import * as SIZE from './scene-size';
import Axis from './axis';
import Plaid from './plaid';
import GLOBAL from '@/script/scale';
import Btn from './btn';
import Client_Card from './client_card';

class Duel {
	element : HTMLDivElement | null = null;
	set_element = (el : HTMLDivElement | null) => this.element = el;
	
	renderer : CSS.CSS3DRenderer = new CSS.CSS3DRenderer();
	scene : THREE.Scene = new THREE.Scene();
	camera : THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
	plaids : Array<Plaid> = [];
	cards : Array<Client_Card> = [];
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
		window.addEventListener('click', duel.click);
	};

	clear = () => {
		cancelAnimationFrame(this.animation_id);
		this.renderer = new CSS.CSS3DRenderer();
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera();
		this.cards.length = 0;
		this.plaids.length = 0;
		this.btn = null;
		this.animation_id = 0;
		window.removeEventListener('click', duel.click);
	};

	sort = async (location : number, owner : 0 | 1) : Promise<void> => {
		const sort = () : gsap.core.Timeline => {
			const tl = gsap.timeline();
			if (location === LOCATION.DECK) {
				const cards = this.cards.filter(i => i.owner === owner && i.location === location);
				const len = cards.length;
				if (len > 1) {
					for (let v = 0; v < 4; v ++) {
						const card = cards[len - 1];
						tl.to(card.three.position, {
							x : `${!!owner ? '+' : '-'}=${SIZE.WIDTH}px`,
							duration : 0.05
						}, 0 + v * 0.2);
						const z = Math.floor(len / 2) * SIZE.TOP;
						tl.to(card.three.position, {
							z : z,
							duration : 0.05
						}, 0.05 + v * 0.2);
						tl.to(card.three.position, {
							x : `${!!owner ? '-' : '+'}=${SIZE.WIDTH}px`,
							duration : 0.05
						}, 0.1 + v * 0.2);
						tl.to(card.three.position, {
							z : len * SIZE.TOP,
							duration : 0.05
						}, 0.15 + v * 0.2);
					}
				}
			} else if (location === LOCATION.HAND) {
				const width = SIZE.WIDTH * SIZE.MAX_HAND;
				const axis = Axis.map.get(LOCATION.HAND)![owner];
				const cards = this.cards.filter(i => i.owner === owner && i.location === location);
				const ct = cards.length;
				cards.forEach((card, v) => {
					const x = (SIZE.HEIGHT + SIZE.GAP.HAND) * axis.x + Math.min(width / ct, SIZE.HEIGHT) * v * (!!owner ? -1 : 1);
					const y = (SIZE.HEIGHT + SIZE.GAP.HAND * 2) * axis.y;
					const z = v * SIZE.GAP.HAND + (!!owner ? 0 : 60);
					if (card.three.position.x !== x ||
						card.three.position.y !== y ||
						card.three.position.z !== z
					)
						tl.to(card.three.position, {
							x : x,
							y : y,
							z : z,
							duration : 0.15
						}, 0);
				});
			}
			return tl;
		}
		let resolve = undefined as (() => void) | undefined;
		const promise = new Promise<void>((r) => resolve = r);
		const tl = sort();
		tl.then(() => resolve?.());
		return promise;
	};

	
	draw = async (player : number, ct : number) : Promise<void> => {
		const deck = this.get.cards(player, LOCATION.DECK).reverse().slice(0, ct);
		const hands = this.get.cards(player, LOCATION.HAND);
		deck.forEach((i, v) => i.set.location(LOCATION.HAND, v + hands.length));
		await Promise.all(deck.map(i => i.update()));
	};

	add = {
		back : () : void => {
			const create_back = (srcs : Array<string> = []) : CSS.CSS3DObject => {
				const dom = document.createElement('div');
				dom.style.width = `${SIZE.WIDTH * 12}px`;
				for (const [v, src] of srcs.entries()) {
					const child = document.createElement('img');
					child.src = src;
					Object.assign(child.style, {
						display : 'block',
						width : `${SIZE.WIDTH * 12}px`,
						height : `${SIZE.HEIGHT * 4}px`,
						transform : !!v ? 'initial' : 'scaleY(-1)'
					});
					dom.appendChild(child);
				}
				return new CSS.CSS3DObject(dom);
			};
			const pic : Array<string> = [mainGame.get.textures(KEYS.OTHER, KEYS.BACKI), mainGame.get.textures(KEYS.OTHER, KEYS.BACKII)] as [string, string];
			const back = create_back(pic);
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
		},
		card : (owner : number,
			location : number,
			seq : number,
			pos : number = POS.NONE,
			id ?: number
		) : Client_Card => {
			const card = reactive(new Client_Card());
			card.set.owner(owner);
			card.set.location(location, seq);
			card.set.pos(pos);
			if (id)
				card.set.id(id);

			card.three.position
				.set(...Axis.computed.card(card).get.xyz());
			this.scene.add(card.three);
			this.cards.push(card);
			return card;
		}
	};

	get = {
		cards : (player : number, loc : number) => this.cards.filter(i => (i.location & loc) && (i.owner === player))
	};

	update = async () : Promise<void> => Promise.all(this.cards.map(i => i.update())).then(() => {});
	
	click = (event : Event) : void => {
		const target = event.target as HTMLElement;
		const card = this.cards.find(i => i.contains(target));
		this.cards
			.filter(i => i.clicked && i !== card)
			.forEach(i => i.click.img());
		if (target.classList.contains('btn'))
			card?.click.btn(target);
		card?.click.img();
	};
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
export { duel };