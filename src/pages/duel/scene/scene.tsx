import { defineComponent, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';
import lodash from 'lodash';

import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import GLOBAL from '@/script/scale'
;
import { LOCATION, POS } from '@/pages/duel/ygo-protocol/network';
import Dialog from '@/pages/ui/dialog';

import * as SIZE from './scene-size';
import Axis from './axis';
import Plaid from './plaid';
import Btn from './btn';
import Client_Card from './client_card';

import connect from '../connect';

class _Duel {
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
			transition : 'all 0.5s ease',
			transform : 'translateX(80px)'
		});
		this.renderer.setSize(GLOBAL.WIDTH - 600, GLOBAL.HEIGHT);
		this.camera.position.set(0, -300, 780);
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

	sort = {
		deck : async (owner : 0 | 1) : Promise<void> => {
			const sort = () : gsap.core.Timeline => {
				const tl = gsap.timeline();
				const cards = lodash.orderBy(
					this.cards
						.filter(i => i.owner === owner && i.location === LOCATION.DECK),
					['seq']
				);
				const len = cards.length;
				if (len > 1) {
					const card = cards[1];
					for (let v = 0; v < 4; v ++) {
						tl.to(card.three.position, {
							x : `${!!owner ? '+' : '-'}=${SIZE.WIDTH}px`,
							duration : 0.05
						}, v * 0.2);
						tl.to(card.three.position, {
							z : card.seq * SIZE.TOP / 2,
							duration : 0.05
						}, 0.05 + v * 0.2);
						tl.to(card.three.position, {
							x : `${!!owner ? '-' : '+'}=${SIZE.WIDTH}px`,
							duration : 0.05
						}, 0.1 + v * 0.2);
						tl.to(card.three.position, {
							z : card.seq * SIZE.TOP,
							duration : 0.05
						}, 0.15 + v * 0.2);
					}
				}
				return tl;
			}
			let resolve = undefined as (() => void) | undefined;
			const promise = new Promise<void>((r) => resolve = r);
			const tl = sort();
			tl.then(() => resolve?.());
			return promise;
		},
		hand : async (owner : 0 | 1, hands : Array<number>) : Promise<Array<Client_Card>> => {
			const sort = (a : Array<Client_Card>, b : Array<number>) : void => {
				const groups = new Map<number, Array<Client_Card>>();
				a.forEach(i => {
					if (!groups.has(i.id))
						groups.set(i.id, []);
					groups.get(i.id)!.push(i);
				});
				
				const pointers = new Map();
				groups.forEach((_, code) => pointers.set(code, 0));
				
				b.forEach((i, v) => {
					const group = groups.get(i);
					const pointer = pointers.get(i) ?? 0;
					if (group && pointer < group.length) {
						const card = group[pointer];
						card.set.seq(v);
						pointers.set(i, pointer + 1);
					}
				});
			}
			const cards = this.cards
				.filter(i => i.owner === owner && i.location === LOCATION.HAND);
			cards
				.filter(i => i.clicked)
				.forEach(i => i.click.img());
			sort(cards, hands);
			await Promise.all(cards.map(i => i.update()));
			return cards;
		}
	};

	
	draw = (player : number, ct : number) : Array<Client_Card> => {
		const deck = this.get.cards()
			.filter(i => i.owner === player && i.location & LOCATION.DECK)
			.reverse()
			.slice(0, ct);
		const hands = this.get.cards()
			.filter(i => i.owner === player && i.location & LOCATION.HAND);
		deck.forEach((i, v) => i
			.set.location(LOCATION.HAND)
			.set.seq(v + hands.length)
			.set.pos(POS.FACEUP_ATTACK)
		);
		return deck;
	};

	attack = async (a : Client_Card, d ?: Client_Card) : Promise<[Client_Card, Client_Card | undefined]> => {
		const tl = gsap.timeline();
		const loc = [
			Axis.computed.card(a),
			d ? Axis.computed.card(d)
				: new Axis(0, 3.5 * (SIZE.HEIGHT + SIZE.GAP.SCENE) * (!!a.owner ? - 1 : 1), 10)
		];
		const direct = {
			x : loc[1].x > loc[0].x ? -1 : 1,
			y : loc[1].y > loc[0].y ? -1 : 1
		};
		const y = loc[0].y - loc[1].y;
		const x = loc[0].x - loc[1].x + SIZE.WIDTH * ((4 - Math.abs(SIZE.GAP.SCENE)) / 5) * direct.x;
		let time = 0;
		//同y轴的怪兽发生战斗(额外怪兽区)
		if (y === 0) {
			tl.to(a.three.rotation, {
				z : Math.PI / (2 * direct.x),
				duration : 0.1,
			}, time);
			if (d)
				tl.to(d.three.rotation, {
					z : Math.PI / (2 * - direct.x),
					duration : 0.1,
				}, time);
			time += 0.1;
		//非同y轴的怪兽发生战斗
		} else {
			tl.to(a.three.rotation, {
				z : Math.atan(- x / y) + (!!a.owner ? Math.PI : 0),
				duration : 0.1,
			}, time);
			if (d)
				tl.to(d.three.rotation, {
					z : Math.atan(- x / y) + (!a.owner ? Math.PI: 0),
					duration : 0.1,
				}, time);
			time += 0.1;
		}
		//抬起动作
		let move : {
			x ?: string | number,
			y ?: string | number,
			z ?: string | number,
			duration : number
		} = {
			x : `+= ${20 * direct.x}`,
			z : '+= 100',
			duration : 0.2,
		};
		if (loc[1].y !== loc[0].y)
			Object.assign(move, {
				y : `+= ${20 * direct.y}`
			});
		tl.to(a.three.position, move, time);
		time += 0.1;
		//攻击
		move = {
			x : loc[1].x + SIZE.WIDTH * direct.x
				* (d ? (4 - Math.abs((a.seq > 4 ? a.seq - 4 : a.seq) - (d.seq > 4 ? d.seq - 4 : d.seq))) / 20
					: 0),
			z : loc[1].z! + 1,
			duration : 0.2,
		};
		if (loc[1].y !== loc[0].y)
			Object.assign(move, {
				y : loc[1].y + (SIZE.HEIGHT / 2 * direct.y)
			});
		tl.to(a.three.position, move, time);
		time += 0.2;
		//受击
		if (d) {
			const move = {
				x : `+= ${40 * - direct.x}`,
				duration : 0.1,
			};
			if (loc[1].y !== loc[0].y)
				Object.assign(move, {
					y : `+= ${40 * - direct.y}`
				});
			tl.to(d.three.position, move, time);
			time += 0.1;
		}
		//攻击的卡回到原位
		tl.to(a.three.rotation, {
			z : !!a.owner ? Math.PI : 0,
			y : Math.PI * 2,
			duration : 0.1,
		}, time);
		tl.to(a.three.position, {
			x : loc[0].x,
			y : loc[0].y,
			z : loc[0].z,
			duration : 0.2,
		}, time);
		time += 0.1;
		//受击的卡回到原位
		if (d) {
			tl.to(d.three.rotation, {
				z : !a.owner ? Math.PI : 0,
				duration : 0.1,
			}, time);
			time += 0.1;
			tl.to(d.three.position, {
				x : loc[1].x,
				y : loc[1].y,
				z : loc[1].z,
				duration : 0.1,
			}, time);
		}
		let resolve = undefined as (() => void) | undefined;
		const promise = new Promise<void>((r) => resolve = r);
		tl.then(() => resolve?.());
		await promise;
		return [a, d];
	};

	add = {
		back : () : void => {
			const create_back = (srcs : Array<string> = []) : CSS.CSS3DObject => {
				const dom = document.createElement('div');
				dom.style.width = `${SIZE.WIDTH * 12}px`;
				for (const [v, src] of srcs.reverse().entries()) {
					const child = document.createElement('img');
					child.src = src;
					child.onerror = () => child.style.opacity = '0';
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
			pos : number = POS.FACEDOWN_ATTACK,
			id ?: number
		) : Client_Card => {
			const card = new Client_Card();
			card
				.set.owner(owner)
				.set.location(location)
				.set.seq(seq)
				.set.pos(pos)
				.set.id(id ?? 0);

			card.three.position
				.set(...Axis.computed.card(card).get.xyz());
			this.scene.add(card.three);
			this.cards.push(card);
			return card;
		}
	};

	get = {
		cards : () => this.cards
	};

	clear = {
		self : () : void => {
			cancelAnimationFrame(this.animation_id);
			this.renderer = new CSS.CSS3DRenderer();
			this.scene = new THREE.Scene();
			this.camera = new THREE.PerspectiveCamera();
			this.cards.length = 0;
			this.plaids.length = 0;
			this.btn = null;
			this.animation_id = 0;
			window.removeEventListener('click', duel.click);
		},
		activate : () : Array<Client_Card> => {
			const cards = this.cards.filter(i => Array.from(i.activatable.values()).length);
			cards.forEach(i => i.clear.activate());
			return cards;
		}
	}

	update = async () : Promise<void> => {
		for (let tp = 0; tp < 2; tp ++) {
			const cards = this.get.cards()
				.filter(i => i.owner === tp);
			[LOCATION.HAND, LOCATION.DECK, LOCATION.EXTRA, LOCATION.GRAVE, LOCATION.REMOVED]
				.forEach(loc => cards
					.filter(i => i.location & loc)
					.forEach((i, v) => i.set.seq(v))
				);
		}
			
		await Promise
			.all(this.cards.map(i => i.update()));
	};
	
	click = (event : Event) : void => {
		const target = event.target as HTMLElement;
		if (target.classList.contains('history__card__pic')) {
			connect.card = mainGame.get.card(target.id);
			this.cards
				.filter(i => i.clicked)
				.forEach(i => i.click.img());
		} else {
			const card = this.cards.find(i => i.contains(target));
			if (!card)
				return connect.card = undefined;
			if (card.location & LOCATION.HAND) 
				connect.card = card;
				if (target.classList.contains('duel__card__btn'))
					card?.click.btn(target);
			else {
				const cards = this.cards.filter(i => i.owner === card.owner
					&& (i.location & card.location)
					&& i.seq === card.seq
				)
				connect.card = lodash.maxBy(cards, i => i.seq);
				if (target.classList.contains('duel__card__btn'))
					card?.click.btn(target, cards);
			}
			
			this.cards
				.filter(i => i.clicked && i !== connect.card)
				.forEach(i => i.click.img());
			card?.click.img();
		}
	};

	win = (title : string, message : string) : void => Dialog({
			title : title,
			message : message,
			cancelButton : false
		}, true) as any;
};

const duel = new _Duel();

const Duel = defineComponent({
	setup () {
		onMounted(duel.init);
		onUnmounted(duel.clear.self);
		return () => <div
			ref = {(el) => duel.set_element(el as HTMLDivElement | null)}
		/>;
	},
});

export default Duel;
export { duel };