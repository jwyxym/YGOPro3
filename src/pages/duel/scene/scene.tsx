import { defineComponent, onMounted, onUnmounted, toRaw, watch } from 'vue';
import * as THREE from 'three';
import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';
import lodash from 'lodash';
import PQueue from 'p-queue';

import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';
import GLOBAL from '@/script/scale';
import { I18N_KEYS } from '@/script/language/i18n';

import { COMMAND, LOCATION, POS } from '@/pages/duel/ygo-protocol/network';
import connect from '@/pages/duel/connect';

import * as SIZE from './scene-size';
import Axis from './axis';
import Plaid from './plaid';
import Btn from './btn';
import Client_Card from './client_card';
import Activate from './activate';


class _Duel {
	element : HTMLDivElement | null = null;
	set_element = (el : HTMLDivElement | null) => this.element = el;
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	
	renderer : CSS.CSS3DRenderer = new CSS.CSS3DRenderer();
	scene : THREE.Scene = new THREE.Scene();
	camera : THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
	plaids : Array<Plaid> = [];
	cards : Array<Client_Card> = [];
	card_elements : WeakMap<HTMLElement, Client_Card> = new WeakMap();
	clicked_card ?: Client_Card;
	back ?: CSS.CSS3DObject;
	btn ?: Btn;
	activate ?: Activate;
	animation_id : number = 0;
	time : number = 0;
	interval : number = 0;
	resolve : (() => void) | undefined = undefined;
	await = new Promise<void>((r) => this.resolve = r);

	animate = (time : number) => {
		this.animation_id = requestAnimationFrame(this.animate);
		
		if (time - this.time < this.interval) return;

		this.time = time;
		this.renderer.render(this.scene, this.camera);
	};

	init = () => {
		if (!this.element)
			return;
		this.renderer.domElement.classList.add('ygopro3__duel__scene')
		this.renderer.setSize(GLOBAL.WIDTH - 600, GLOBAL.HEIGHT);
		this.camera.position.set(0, -300, 780);
		this.camera.lookAt(0, -60, 0);

		this.add.activate();
		this.add.back();
		this.add.btn();
		for (let x = - 3; x < 4; x++)
			for (let y = - 2; y < 3; y++)
				if (y !== 0 || x % 2 !== 0)
    				this.add.plaid(x, y);
		if (connect.wait.info.duel_rule >= 0 && connect.wait.info.duel_rule <= 3)
			for (const x of [- 2, 2])
				for (const y of [- 3, 3])
					this.add.plaid(x, y);

		this.scene.add(new THREE.AmbientLight('white', 1));
		this.element!.appendChild(this.renderer.domElement);
		this.interval = 1000 / (mainGame.get.system(KEYS.SETTING_FRAME) as number);
		requestAnimationFrame(this.animate);
		this.renderer.domElement.classList.add('show')
		window.addEventListener('click', duel.click);
		this.resolve?.();
	};

	confrim = {
		hand : async (cards : Array<Client_Card>) : Promise<void> => {
			const tls = gsap.timeline();
			const turn = (el : HTMLImageElement, pic : string) : gsap.core.Timeline => {
				const tl = gsap.timeline();
				tl.set(el, {
					rotationY : 0
				});
				tl.to(el, {
					rotationY : 90,
					duration : 0.1,
					onComplete : () => (el.src = pic ?? '') as unknown as void
				});
				tl.set(el, {
					rotationY : -90
				}, 0.2);
				tl.to(el, {
					rotationY : 0,
					duration : 0.1
				}, 0.25);
				return tl;
			};
			for (const card of cards) {
				const img = card.get.el.img();
				const back = mainGame.back.pic;
				const chk = img.src === back;
				const tl = gsap.timeline();
				if (card.owner) {
					if (chk)
						tl.add(turn(img, mainGame.get.card(card.id).pic ?? mainGame.unknown.pic));

					tl.to(img, {
						rotationZ : - 180,
						duration : 0.1,
					}, '+=0');
					const x = card.three.position.x;
					const y = card.three.position.y;
					tl.to(card.three.position, {
						x : 0,
						y : - 200,
						z : '+=250',
						duration : 0.2,
					}, '+=0.2');
					tl.to(card.three.position, {
						x : x,
						y : y,
						z : '-=250',
						duration : 0.2,
					}, '+=0.5');
					tl.to(img, {
						rotationZ : 0,
						duration : 0.1,
					}, '+=0.2');
					if (chk)
						tl.add(turn(img, back), '+=0.1');
				} else if (connect.wait.self.position > 3 && chk) {
					tl.add(
						turn(img, mainGame.get.card(card.id).pic ?? mainGame.unknown.pic)
					);
					tl.add(turn(img, back), '+=0.1');
				}
				tls.add(tl, '>');
			}
			let resolve = undefined as (() => void) | undefined;
			const promise = new Promise<void>((r) => resolve = r);
			tls.then(() => resolve?.());
			await promise;
		},
		decktop : async (cards : Array<Client_Card>) : Promise<void> => {
			for (const card of cards) {
				const tl = gsap.timeline();
				const img = card.get.el.img();
				const pic = mainGame.get.card(card.id).pic
					?? mainGame.unknown.pic;
				const back = mainGame.back.pic;
				if (card.pos & POS.FACEDOWN) {
					tl.to(card.three.position, {
						x : `${!!card.owner ? '+' : '-'}=${SIZE.WIDTH}px`,
						duration : 0.1
					}, 0);
					tl.to(img, {
						rotationY : 90,
						duration : 0.05,
						onComplete : () => (img.src = pic) as unknown as void
					}, 0.1);
					tl.set(img, {
						rotationY : -90
					}, 0.15);
					tl.to(img, {
						rotationY : 0,
						duration : 0.05
					}, 0.2);
					tl.to(img, {
						rotationY : 90,
						duration : 0.05,
						onComplete : () => (img.src = back) as unknown as void
					}, 0.45);
					tl.set(img, {
						rotationY : -90
					}, 0.5);
					tl.to(img, {
						rotationY : 0,
						duration : 0.05
					}, 0.55);
					tl.to(card.three.position, {
						x : `${!!card.owner ? '-' : '+'}=${SIZE.WIDTH}px`,
						duration : 0.1
					}, 0.6);
				} else {
					img.src = pic;
					tl.to(card.three.position, {
						x : `${!!card.owner ? '+' : '-'}=${SIZE.WIDTH}px`,
						duration : 0.1
					}, 0);
					tl.to(card.three.position, {
						x : `${!!card.owner ? '-' : '+'}=${SIZE.WIDTH}px`,
						duration : 0.1
					}, 0.2);
				}
				let resolve = undefined as (() => void) | undefined;
				const promise = new Promise<void>((r) => resolve = r);
				tl.then(() => resolve?.());
				await promise;
			}
		} 
	};

	sort = {
		on : (owner : 0 | 1, loc : number) : gsap.core.Timeline => {
			const tl = gsap.timeline();
			const cards = lodash.orderBy(
				this.cards
					.filter(i => i.owner === owner
						&& (i.location & loc)
						&& (i.pos & POS.FACEDOWN)
					),
				i => i.seq
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
		},
		deck : async (owner : 0 | 1) : Promise<void> => {
			let resolve = undefined as (() => void) | undefined;
			const promise = new Promise<void>((r) => resolve = r);
			const tl = this.sort.on(owner, LOCATION.DECK);
			tl.then(() => resolve?.());
			return promise;
		},
		ex_deck : async (owner : 0 | 1) : Promise<void> => {
			let resolve = undefined as (() => void) | undefined;
			const promise = new Promise<void>((r) => resolve = r);
			const tl = this.sort.on(owner, LOCATION.EXTRA);
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
						card
							.set.seq(v);
						pointers
							.set(i, pointer + 1);
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

	
	draw = (player : number, ct : number, codes : Array<number> = []) : Array<Client_Card> => {
		const deck = this.get.cards()
			.filter(i => i.owner === player && i.location & LOCATION.DECK)
			.reverse()
			.slice(0, ct);
		const hands = this.get.cards()
			.filter(i => i.owner === player && i.location & LOCATION.HAND);

		deck.forEach((i, v) => {
			if (!player && codes[v])
				i.set.id(codes[v]);
			i
				.set.location(LOCATION.HAND)
				.set.seq(v + hands.length)
				.set.pos(player || !codes[v] ? POS.FACEDOWN_ATTACK : POS.FACEUP_ATTACK);
		});
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
		activate : () : void => {
			const activate = new Activate();
			activate.three.position.set(0, 0, - 100);
			this.scene.add(activate.three);
			this.activate = activate;
		},
		back : () : void => {
			const create_back = (srcs : Array<string> = []) : CSS.CSS3DObject => {
				const dom = document.createElement('div');
				dom.classList.add('ygopro3__duel__back');
				for (const [v, src] of srcs.reverse().entries()) {
					const child = document.createElement('img');
					child.src = src;
					child.onload = () => child.classList.add('show');
					if (!v)
						child.classList.add('ygopro3__duel__back_oppo');
					dom.appendChild(child);
				}
				return new CSS.CSS3DObject(dom);
			};
			const pic : Array<string> = [mainGame.get.textures(KEYS.OTHER, KEYS.BACKI), mainGame.get.textures(KEYS.OTHER, KEYS.BACKII)] as [string, string];
			const back = create_back(pic);
			back.position.set(...Axis.computed.back(new Axis(0, 0, 0)).get.xyz());
			this.back = back;
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
			this.card_elements.set(card.three.element, card);
			return card;
		}
	};

	remove = {
		card : (card : Client_Card) : Client_Card => {
			this.cards.find(i => i.equip === card)?.equip === undefined;
			const ct = this.cards.indexOf(card);
			if (ct > - 1)
				this.cards.splice(ct, 1);
			this.card_elements.delete(card.three.element);
			if (this.clicked_card === card)
				this.clicked_card = undefined;
			this.scene.remove(card.three);
			if (card.location & LOCATION.OVERLAY) {
				const loc = card.location & ~ LOCATION.OVERLAY;
				const ocard = this.get.cards().find(i =>
					(i.location & loc)
					&& i.seq === card.seq
				);
				if (ocard) {
					const ct = ocard.overlays.indexOf(card);
					if (ct > - 1)
						ocard.overlays.splice(ct, 1);
				}
			}
			return card;
		}
	}

	get = {
		cards : () => this.cards,
		plaids : () => this.plaids
	};

	clear = {
		self : () : void => {
			cancelAnimationFrame(this.animation_id);
			this.renderer = new CSS.CSS3DRenderer();
			this.scene = new THREE.Scene();
			this.camera = new THREE.PerspectiveCamera();
			this.cards.length = 0;
			this.plaids.length = 0;
			this.card_elements = new WeakMap();
			this.clicked_card = undefined;
			this.animation_id = 0;
			this.time = 0;
			this.back = undefined;
			this.btn = undefined;
			window.removeEventListener('click', duel.click);
		},
		activate : () : Array<Client_Card> => {
			const cards = this.cards.filter(i => Array.from(i.activatable.values()).length);
			cards.forEach(i => i.clear.activate());
			if (duel.btn)
				duel.btn.enable.length = 0;
			this.btnable(false);
			return cards;
		}
	}

	update = async (cards : Array<Client_Card> = []) : Promise<void> => {
		if (cards.length)
			await Promise
				.all(cards.map(i => i.update()));
		else {
			for (let tp = 0; tp < 2; tp ++) {
				const cards = this.get.cards()
					.filter(i => i.owner === tp);
				[LOCATION.HAND, LOCATION.DECK, LOCATION.EXTRA, LOCATION.GRAVE, LOCATION.REMOVED]
					.forEach(loc => lodash.sortBy(
							cards.filter(i => i.location & loc),
							i => i.seq
						)
							.forEach((i, v) => {
								i.set.seq(v);
								if (loc === LOCATION.HAND)
									i.set.pos(i.id ? POS.FACEUP_ATTACK : POS.FACEDOWN_ATTACK);
								else {
									if ((loc & (LOCATION.GRAVE | LOCATION.OVERLAY)))
										i.set.pos(POS.FACEUP_ATTACK);
									else if (loc & LOCATION.DECK)
										i.set.pos(connect.duel.reverse ? POS.FACEUP_ATTACK : POS.FACEDOWN_ATTACK);
								}
							})
					);
				for (let seq = 0; seq < 7; seq ++) {
					const c = cards.find(i =>
						i.location === LOCATION.MZONE
						&& i.seq === seq
					);
					if (!c) continue;
					c
						.set
						.overlay(c.overlays.length)
						.overlays
						.forEach((i, v) => {
							i
								.set.location(LOCATION.MZONE | LOCATION.OVERLAY)
								.set.overlay(v)
								.set.pos(POS.FACEUP_ATTACK)
						});

					if (c.equip && c.equip.location & LOCATION.OVERLAY)
						c.clear.equip();
				}
			}
				
			await Promise
				.all(this.cards.map(i => i.update()));
			if (connect.duel.card instanceof Client_Card)
				duel.activate?.on(
					connect.duel.card,
					connect.duel.card.location & LOCATION.ONFIELD
						? [] : connect.duel.cards
				);
		}
	};

	btnable = (chk : boolean) : void => {
		if (this.activate) {
			this.activate.btnable = chk;
			if (!chk)
				duel.activate?.off();
		}
	};

	clear_clicked = (except ?: Client_Card) : void => {
		if (this.clicked_card
			&& this.clicked_card !== except
			&& this.clicked_card.clicked
		)
			this.clicked_card.click.img();
		this.clicked_card = except;
	};

	get_card = (target : HTMLElement) : Client_Card | undefined => {
		const element = target.closest('.ygopro3__duel__card') as HTMLElement | null;
		return element ? this.card_elements.get(element) : undefined;
	};
	
	click = (event : Event | Client_Card | number) : void => {
		if (!this.element) return;
		this.queue.add(async () => {
			if (event instanceof Client_Card || typeof event === 'number') {
				connect.duel.card = event;
				this.clear_clicked();
			} else {
				if (connect.duel.cards.length) {
					connect.duel.cards.length = 0;
					await mainGame.sleep(100);
				}
				const target = event.target;
				if (!(target instanceof HTMLElement) || target.closest('.ygopro3__card__info, .ygopro3__duel__log'))
					return;
				if (this.btn?.contains(target)) {
					this.clear_clicked();
					connect.duel.card = undefined;
					if (this.btn.enable.length > 0 && !connect.duel.select.chk()) {
						const array = this.btn.enable
							.map(i => mainGame.get.text(i));
						connect.duel.select.option.cancelable = true;
						connect.duel.select.option.title = mainGame.get.text(I18N_KEYS.DUEL_PHASE_CHANGE);
						connect.duel.select.option.array = array;
						connect.duel.select.option.show = true;
						connect.duel.select.option.confirm = async (i ?: number) => {
							connect.duel.select.option.show = false;
							if (this.btn && i!== undefined)
								await connect.response?.(this.btn.enable[i], COMMAND.PHASE);
						}
					}
					return;
				}
				if (this.activate?.contains(target)) {
					connect.duel.card = undefined;
					this.clear_clicked();
					return this.activate.click(target);
				}
				const card = this.get_card(target);
				if (!card) {
					connect.duel.card = undefined;
					this.clear_clicked();
					return;
				}
				if (card.location & LOCATION.HAND) {
					if (toRaw(connect.duel.card) === card && card.clicked)
						connect.duel.card = undefined;
					else
						connect.duel.card = card;
				} else {
					const cards : Array<Client_Card> = [];
					let c : Client_Card | undefined = undefined;
					let max = - Infinity;
					const is_mzone = !!(card.location & LOCATION.MZONE);
					for (const i of this.cards) {
						if (i.owner !== card.owner
							|| !(i.location & card.location)
							|| (i.seq !== card.seq && (i.location & LOCATION.ONFIELD))
						)
							continue;
						cards.push(i);
						const value = is_mzone ? i.overlay : i.seq;
						if (!c || value > max) {
							c = i;
							max = value;
						}
					}
					if (toRaw(connect.duel.card) === c && c?.clicked)
						connect.duel.card = undefined;
					else
						connect.duel.card = c;
					if (!(card.location & LOCATION.DECK)
						&& (cards.length > 1 || !(card.location & LOCATION.ONFIELD))
					)
						connect.duel.cards = cards;
				}

				const selected = toRaw(connect.duel.card);
				if (selected instanceof Client_Card) {
					this.clear_clicked(selected);
					if (!selected.clicked)
						selected.click.img();
					this.clicked_card = selected;
				} else
					this.clear_clicked();
			}
		});
	};
};

watch(() => connect.duel.card, (n, o) => {
	const get_equip = (c : Client_Card) => duel.get.cards()
		.filter(i => i === c || i.equip === c || (c?.equip && (i.equip === c.equip || i === c.equip)));
	const o_card = toRaw(o);
	if (o_card instanceof Client_Card) {
		const cards = get_equip(o_card);
		if (cards.length > 1)
			cards.forEach(i => i.hint.equip());
	}
	const n_card = toRaw(n);
	if (n_card instanceof Client_Card) {
		const cards = get_equip(n_card);
		if (cards.length > 1)
			cards.forEach(i => i.hint.equip(true));
		duel.activate?.on(n_card, n_card.location & LOCATION.ONFIELD ? [] : connect.duel.cards);
	} else duel.activate?.off();
})

const duel = new _Duel();

const Duel = defineComponent({
	setup () {
		onMounted(duel.init);
		onUnmounted(duel.clear.self);
		return () => <div
			style = {{
				'--height' : `${SIZE.HEIGHT}px`,
				'--width' : `${SIZE.WIDTH}px`
			}}
			ref = {(el) => duel.set_element(el as HTMLDivElement | null)}
		/>;
	},
});

export default Duel;
export { duel };
