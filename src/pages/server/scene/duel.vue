<template>
	<div class = 'canvas' ref = 'canvas'>
	</div>
</template>
<script setup lang = 'ts'>
	import { ref, onMounted, Ref, onUnmounted, watch, reactive } from 'vue';
	import * as THREE from 'three';
	import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js'
	
	import mainGame from '@/script/game';
	import * as CONSTANT from '@/script/constant';
	import { TYPE } from '@/script/card';
	import { LOCATION, POS } from '@/pages/server/post/network';
	import { Idles_Cards, Plaids } from '@/pages/server/post/tcp';
	import Client_Card from './client_card';
	import Plaid from './plaid';
	import gsap from './gsap';
	import Btn from './btn';

	interface Axis {
		x : number,
		y : number,
		z ?: number
	};

	interface Position {
		loc : number,
		owner : number
	};

	interface Card_From {
		location : number;
		seq : number;
		zone : number;
		pos ?: number;
	};

	const canvas : Ref<HTMLElement | null> = ref(null);

	const hover = {
		on : (card : Client_Card, _ : MouseEvent) : void => {
			if (duel.cards.get(LOCATION.HAND)!(0).includes(card) && hover.select !== card) {
				card.div.img.style.transform = 'translateY(-30px)';
				card.three.position.setZ(duel.cards.get(LOCATION.HAND)!(0).indexOf(card) * three.create.hand_gap + 0.1 + three.create.float);
			} else if (duel.cards.get(LOCATION.HAND)!(1).includes(card)) {
				card.div.img.style.transform = 'translateY(-30px)';
				card.three.position.setZ(duel.cards.get(LOCATION.HAND)!(1).indexOf(card) * three.create.hand_gap + 0.1);
			}
		},
		end : (card : Client_Card, _ : MouseEvent) : void => {
			if (duel.cards.get(LOCATION.HAND)!(0).includes(card) && hover.select !== card) {
				card.div.img.style.transform = 'translateY(0)';
				card.three.position.setZ(duel.cards.get(LOCATION.HAND)!(0).indexOf(card) * three.create.hand_gap + three.create.float);
			} else if (duel.cards.get(LOCATION.HAND)!(1).includes(card)) {
				card.div.img.style.transform = 'translateY(0)';
				card.three.position.setZ(duel.cards.get(LOCATION.HAND)!(1).indexOf(card) * three.create.hand_gap);
			}
		},
		show_off : () : void => {
			if (hover.select === undefined)
				return;
			hover.select.show.btn.off();
			if ((duel.cards.get(LOCATION.HAND)!(0) as Array<Client_Card>).includes(hover.select)) {
				hover.select.div.img.style.transform = 'translateY(0)';
				hover.select.three.position.setZ(duel.cards.get(LOCATION.HAND)!(0).indexOf(hover.select) * three.create.hand_gap + three.create.float);
			}
			hover.select = undefined;
		},
		click : async (e : MouseEvent) : Promise<void> => {
			const target = e.target as HTMLElement;
			const show_off = hover.show_off;
			if (three.btn !== undefined && three.btn.three.element.contains(target)) {
				show_off();
				await props.connect.phase.select();
				return;
			}
			let cards : Array<Client_Card>;
			let ct : number;
			cards = duel.cards.get(LOCATION.HAND)!(0);
			ct = cards.findIndex(i => i.three.element.contains(target));
			if (ct > -1) {
				const card = cards[ct];
				const chk = hover.select !== card;
				show_off();
				if (chk) {
					card.div.img.style.transform = 'translateY(-30px)';
					card.three.position.setZ(duel.cards.get(LOCATION.HAND)!(0).indexOf(card) * three.create.hand_gap + 0.1 + three.create.float);
					card.show.btn.on();
					hover.select = card;
				}
				return;
			}
			cards = duel.cards.get(LOCATION.ONFIELD)!(2);
			ct = cards.findIndex(i => i.three.element.contains(target));
			if (ct > -1) {
				const card = cards[ct];
				const chk = hover.select !== card;
				show_off();
				if (chk) {
					card.show.btn.on();
					hover.select = card;
				}
				return;
			}
			for (const tp of [0, 1])
				for (const loc of [LOCATION.DECK, LOCATION.EXTRA, LOCATION.GRAVE, LOCATION.REMOVED]) {
					cards = duel.cards.get(loc)!(tp);
					ct = cards.findIndex(i => i.three.element.contains(target));
					if (ct > -1) {
						const card = cards[cards.length - 1];
						const chk = hover.select !== card;
						show_off();
						if (chk) {
							card.show.btn.on();
							hover.select = card;
						}
						return;
					}
				}

			show_off();
		},
		response : async (card : Client_Card, key : string) : Promise<void> => {
			for (const tp of [0, 1])
				for (const loc of [LOCATION.DECK, LOCATION.EXTRA, LOCATION.GRAVE, LOCATION.REMOVED]) {
					const cards : Array<Client_Card> = duel.cards.get(loc)!(tp);
					if (cards.includes(card)) {
						let idle_cards : Array<Client_Card> = [];
						switch (key) {
							case 'summon':
							idle_cards = props.connect.idle.summon.filter(cards);
							break;
						case 'spsummon':
							idle_cards = props.connect.idle.spsummon.filter(cards);
							break;
						case 'mset':
							idle_cards = props.connect.idle.mset.filter(cards);
							break;
						case 'sset':
							idle_cards = props.connect.idle.sset.filter(cards);
							break;
						case 'activate':
							idle_cards = props.connect.idle.activate.filter(cards, 'activate');
							break;
						case 'scale':
							idle_cards = props.connect.idle.activate.filter(cards, 'scale');
							break;
						}
						if (idle_cards.length > 0) {
							const group : Idles_Cards = idle_cards.map(i => {
								return {
									card : i,
									code : i.code,
									seq : cards.indexOf(i)
								};
							});
							if (loc === LOCATION.DECK)
								group.forEach((i, v) => i.seq = v);
							props.connect.select.idles.push(group, key);
						}
						return;
					}
				}
			let code;
			switch (key) {
				case 'summon':
					code = props.connect.idle.summon.index(card) << 16;
					break;
				case 'spsummon':
					code = (props.connect.idle.spsummon.index(card) << 16) + 1;
					break;
				case 'repos':
					code = (props.connect.idle.repos.index(card) << 16) + 2;
					break;
				case 'mset':
					code = (props.connect.idle.mset.index(card) << 16) + 3;
					break;
				case 'sset':
					code = (props.connect.idle.sset.index(card) << 16) + 4;
					break;
				case 'activate':
					const effects : Array<{
						card : Client_Card,
						desc : number
					}> = props.connect.idle.activate.filter(card);
					if (effects.length === 1)
						code = (props.connect.idle.activate.index(effects[0].card, effects[0].desc) << 16) + 5;
					else {
						const i = await props.connect.select.option.on(effects.map(i => i.desc));
						if (i !== undefined)
							code = (props.connect.idle.activate.index(effects[i].card, effects[i].desc) << 16) + 5;
					}
					break;
				case 'scale':
					code = (props.connect.idle.activate.index(card, 1160) << 16) + 5;
					break;
				case 'attack':
					code = (props.connect.idle.attack.index(card) << 16) + 1;
					break;
			}
			if (code !== undefined)
				await props.connect.response(code);
		},
		select : undefined as Client_Card | undefined
	};

	const three = {
		renderer : new CSS.CSS3DRenderer(),
		scene : new THREE.Scene(),
		camera : new THREE.PerspectiveCamera(),
		plaids : [] as Array<Plaid>,
		btn : undefined as undefined | Btn,
		src : {
			unknown : mainGame.get.textures(CONSTANT.KEYS.OTHER, CONSTANT.KEYS.UNKNOWN) as string,
			cover : mainGame.get.textures(CONSTANT.KEYS.OTHER, CONSTANT.KEYS.COVER) as string
		},
		resize : () => {
			three.renderer.setSize(window.innerWidth, window.innerHeight);
		},
		render : () => {
			three.renderer.render(three.scene, three.camera);
		},
		axis : {
			map : new Map([
				[LOCATION.HAND, [
					{ x : -2, y : -3 },
					{ x : 2, y : 3 }
				]],
				[LOCATION.DECK, [
					{ x : 3, y : -2 },
					{ x : -3, y : 2 }
				]],
				[LOCATION.EXTRA, [
					{ x : -3, y : -2 },
					{ x : 3, y : 2 }
				]],
				[LOCATION.FZONE, [
					{ x : -3, y : -1 },
					{ x : 3, y : 1 }
				]],
				[LOCATION.GRAVE, [
					{ x : 3, y : -1 },
					{ x : -3, y : 1 }
				]],
				[LOCATION.REMOVED, [
					{ x : 3, y : 0 },
					{ x : -3, y : 0 }
				]],
				[LOCATION.MZONE | (0 << 16), [
					{ x : -2, y : -1 },
					{ x : 2, y : 1 }
				]],
				[LOCATION.MZONE | (1 << 16), [
					{ x : -1, y : -1 },
					{ x : 1, y : 1 }
				]],
				[LOCATION.MZONE | (2 << 16), [
					{ x : 0, y : -1 },
					{ x : 0, y : 1 }
				]],
				[LOCATION.MZONE | (3 << 16), [
					{ x : 1, y : -1 },
					{ x : -1, y : 1 }
				]],
				[LOCATION.MZONE | (4 << 16), [
					{ x : 2, y : -1 },
					{ x : -2, y : 1 }
				]],
				[LOCATION.MZONE | (5 << 16), [
					{ x : -1, y : 0 },
					{ x : 1, y : 0 }
				]],
				[LOCATION.MZONE | (6 << 16), [
					{ x : 1, y : 0 },
					{ x : -1, y : 0 }
				]],
				[LOCATION.SZONE | (0 << 16), [
					{ x : -2, y : -2 },
					{ x : 2, y : 2 }
				]],
				[LOCATION.SZONE | (1 << 16), [
					{ x : -1, y : -2 },
					{ x : 1, y : 2 }
				]],
				[LOCATION.SZONE | (2 << 16), [
					{ x : 0, y : -2 },
					{ x : 0, y : 2 }
				]],
				[LOCATION.SZONE | (3 << 16), [
					{ x : 1, y : -2 },
					{ x : -1, y : 2 }
				]],
				[LOCATION.SZONE | (4 << 16), [
					{ x : 2, y : -2 },
					{ x : -2, y : 2 }
				]]
			]) as Map<number, Array<Axis>>,
			computed : (owner : number, location : number, seq : number) : Array<number> => {
				const axis : Axis = three.axis.map.get(location)![owner];
				const x : number = (three.create.size.height + three.create.gap) * axis.x;
				let y : number;
				const z : number  = seq * three.create.size.top;
				if (axis.x % 3 === 0 && axis.x !== 0) {
					if (axis.x === -3)
						y = (three.create.size.height + three.create.gap) * axis.y
							+ (axis.y >= 0 ? three.create.offset : -three.create.offset);
					else
						y = (three.create.size.height + three.create.gap) * axis.y
							+ (axis.y <= 0 ? -three.create.offset : three.create.offset);
				} else {
					y = (three.create.size.height + three.create.gap) * axis.y;
				}
				return [x, y, z];
			}
		},
		cards : {
			map : new Map([
				[LOCATION.HAND, [[], []]],
				[LOCATION.DECK, [[], []]],
				[LOCATION.EXTRA, [[], []]],
				[LOCATION.FZONE, [[], []]],
				[LOCATION.GRAVE, [[], []]],
				[LOCATION.REMOVED, [[], []]],
				[LOCATION.MZONE | (0 << 16), [[], []]],
				[LOCATION.MZONE | (1 << 16), [[], []]],
				[LOCATION.MZONE | (2 << 16), [[], []]],
				[LOCATION.MZONE | (3 << 16), [[], []]],
				[LOCATION.MZONE | (4 << 16), [[], []]],
				[LOCATION.MZONE | (5 << 16), [[], []]],
				[LOCATION.MZONE | (6 << 16), [[], []]],
				[LOCATION.SZONE | (0 << 16), [[], []]],
				[LOCATION.SZONE | (1 << 16), [[], []]],
				[LOCATION.SZONE | (2 << 16), [[], []]],
				[LOCATION.SZONE | (3 << 16), [[], []]],
				[LOCATION.SZONE | (4 << 16), [[], []]]
			]) as Map<number, Array<Array<Client_Card>>>,
			change : (target : Client_Card, owner : number, from : number, location : number = 0, seq : number = 0) : number => {
				let result = 0;
				if (from > 0) {
					const ct = three.cards.map.get(from)![owner].indexOf(target);
					three.cards.map.get(from)![owner].splice(ct, 1);
					if (ct > 0 && (from & LOCATION.MZONE) === LOCATION.MZONE)
						result = ct;
					if (ct < three.cards.map.get(from)![owner].length)
						three.sort(owner, from);
				}
				if (three.cards.map.has(location))
					seq === 0 ? three.cards.map.get(location)![owner].push(target)
						: three.cards.map.get(location)![owner].splice(seq, 0, target);
				return result;
			},
			location : (card : Client_Card | HTMLElement, location : number, owner : number = 2) : boolean => {
				if (card instanceof Client_Card)
					return three.cards.map.get(location)![owner].includes(card);
				else return three.cards.map.get(location)![owner].findIndex(i => i.three.element.contains(card)) > -1;
			},
			hand : {
				max : 7
			}
		},
		create : {
			size : {
				width : 0,
				height : 90,
				top : 0.6
			},
			offset : 0,
			gap : 8,
			hand_gap : 0.05,
			float : 60,
			card : (src : string) : Client_Card => {
				return reactive(new Client_Card(src, three.create.size, hover));
			},
			back : (srcs : Array<string> = []) : CSS.CSS3DObject => {
				const dom = document.createElement('div');
				dom.style.width = `${three.create.size.width * 12}px`;
				dom.style.opacity = '0';
				for (const [v, src] of srcs.entries()) {
					const child = document.createElement('img');
					child.src = src;
					child.style.display = 'block';
					child.style.width = `${three.create.size.width * 12}px`;
					child.style.height = `${three.create.size.height * 4}px`;
					if (v === 0)
						child.style.transform = 'scaleY(-1)';
					dom.appendChild(child);
				}
				return new CSS.CSS3DObject(dom);
			},
			send : {
				to : (target : Client_Card, owner : number, location : number, from : number = 0, seq : number = 0, pos : number = POS.NONE) : void => {
					target.update.loc([LOCATION.PZONE, LOCATION.FZONE].includes(location) ? LOCATION.SZONE : location);
					switch (location) {
						case LOCATION.NONE:
							three.create.send.none(target, owner, from);
							break;
						case LOCATION.HAND:
							three.create.send.hand(target, owner, from);
							break;
						default:
							three.create.send.field(target, owner, location, from, seq, pos);
							break;
					}
				},
				back : (target : CSS.CSS3DObject, axis : Axis) : void => {
					let x : number = (three.create.size.height + three.create.gap) * axis.x;
					let y : number = axis.y;
					let z : number = axis.z!;
					if (axis.x % 3 === 0 && axis.x !== 0) {
						if (axis.x === -3)
							y = (three.create.size.height + three.create.gap) * axis.y
								+ (axis.y >= 0 ? three.create.offset : -three.create.offset);
						else
							y = (three.create.size.height + three.create.gap) * axis.y
									+ (axis.y <= 0 ? -three.create.offset : three.create.offset);
					} else {
						y = (three.create.size.height + three.create.gap) * axis.y;
						z = 0;
					}
					target.position.set(x, y, z);
				},
				field : (target : Client_Card, owner : number, location : number, from : number, seq : number, pos : number = POS.NONE) : void => {
					const [x, y, z] = three.axis.computed(owner, location, seq);
					const ct = three.cards.change(target, owner, from, location, seq);
					three.move(target.three, from, owner, x, y, z);
					three.rotate(target, from, owner, pos);
					if (ct > 0)
						three.cards.map.get(from)![owner][0].change.xyz(three.cards.map.get(from)![owner].length - 1);

					//如果卡片被送到场上（且不为超量素材）
					if ((location & LOCATION.ONFIELD) > 0 && seq >= three.cards.map.get(location)![owner].length - 1) {
						const len = three.cards.map.get(location)![owner].length - 1;
						if (!!(pos & POS.FACEUP)) {
							if (!!(location & (LOCATION.MZONE + LOCATION.PZONE)))
								target.show.info.on(len, !!(location & (LOCATION.PZONE)));

							if ((location & (LOCATION.MZONE)) === LOCATION.MZONE)
								target.show.atk.on();
						}
						//如果不是位置移动则取除指示物
						if ((location & (LOCATION.ONFIELD)) !== (from & (LOCATION.ONFIELD)))
							target.show.counter.off();
						
						three.cards.map.get(location)![owner].slice(0, -1).forEach(card => {
							card.show.info.off();
							card.show.atk.off();
							card.show.counter.off();
							//超量素材和怪兽方向垂直
							three.rotate(card, location, owner, (pos & POS.ATTACK) > 0 ? POS.FACEUP_DEFENSE : POS.FACEUP_ATTACK);
						});
					//超量素材
					} else if ((location & LOCATION.ONFIELD) > 0) {
						target.show.info.off();
						target.show.atk.off();
						target.show.counter.off();
						//更新超量怪兽的素材数量
						const len = three.cards.map.get(location)![owner].length - 1;
						three.cards.map.get(location)![owner][len].change.xyz(len);
					//其他
					} else {
						target.show.info.off();
						target.show.atk.off();
						target.show.counter.off();
					}

					three.sort(owner, from);
					three.sort(owner, location);
				},
				hand : (target : Client_Card, owner : number, from : number = 0) : void => {
					const ct = three.cards.change(target, owner, from, LOCATION.HAND, undefined);
					three.rotate(target, from, owner, !!owner ? POS.FACEDOWN_ATTACK : POS.FACEUP_ATTACK);
					three.sort(owner, LOCATION.HAND);
					target.show.info.off();
					target.show.atk.off();
					if (ct > 0)
						three.cards.map.get(from)![owner][0].change.xyz(three.cards.map.get(from)![owner].length - 1);
				},
				none : (card : Client_Card, owner : number, from : number) : void => {
					gsap.opacity(card.three.element, 0);
					setTimeout(() => {
						three.scene.remove(card.three);
						three.cards.change(card, owner, from);
					}, 200);
				},
			}
		},
		add : {
			card : (owner : number, location : number, seq : number = 0, pic : string | undefined = undefined) : Client_Card => {
				const card = three.create.card(pic ?? three.src.cover);
				if (location === LOCATION.MZONE || location === LOCATION.SZONE)
					location |= seq << 16;
				three.create.send.to(card, owner, location, 0, three.cards.map.get(location)![owner].length);
				three.scene.add(card.three);
				gsap.opacity(card.three.element, 1);
				return card;
			},
			back : (pic : Array<string | undefined> = mainGame.get.textures(CONSTANT.FILES.TEXTURE_BACK) as Array<string>) : void => {
				const back = three.create.back(pic.filter(i => i !== undefined));
				three.create.send.back(back, { x : 0, y : 0, z : 0 * three.create.size.top });
				three.scene.add(back);
				gsap.opacity(back.element, 1);
			},
			plaid : (x : number, y : number) : void => {
				const plaid = new Plaid(three.create.size, x, y)
				three.create.send.back(plaid.three, { x : x, y : y, z : 0 });
    			three.scene.add(plaid.three);
				three.plaids.push(plaid);
			},
			btn : () : void => {
				const btn = new Btn(three.create.size);
				three.create.send.back(btn.three, { x : 2, y : 0, z : 0 });
    			three.scene.add(btn.three);
				three.btn = btn;
			}
		},
		move : (target : CSS.CSS3DObject, from : number, owner : number, x : number, y : number, z : number) => {
			const move = () => {
				const tl = gsap.timeline();
				if (target.position.z < z) {
					tl.to(target.position, {
						z : z,
						duration : 0.05
					})
					tl.to(target.position, {
						x : x,
						y : y,
						duration : 0.15
					}, 0.05)
				} else {
					tl.to(target.position, {
						x : x,
						y : y,
						duration : 0.15
					})
					tl.to(target.position, {
						z : z,
						duration : 0.05
					}, 0.15)
				}
				tl.then(() => tl.kill());
			}
			!!from ? move() : target.position.set(x, y, z);
			if (from === LOCATION.HAND) {
				three.sort(owner, from);
			}
		},
		sort : (owner : number, location : number, animation : boolean = false) : number => {
			if (location === 0)
				return 0;
			const tl = gsap.timeline();
			let result = 0;
			if (location === LOCATION.HAND) {
				const width = three.create.size.width * three.cards.hand.max;
				const axis = three.axis.map.get(location)![owner] as Axis;
				const ct = three.cards.map.get(location)![owner].length;
				three.cards.map.get(location)![owner].forEach((card, v) => {
					const x = (three.create.size.height + three.create.gap) * axis.x + Math.min(width / ct, three.create.size.width) * v * (!!owner ? -1 : 1);
					const y = (three.create.size.height + three.create.gap * 2) * axis.y;
					const z = v * three.create.hand_gap + (!!owner ? 0 : three.create.float);
					if (card.three.position.x !== x || card.three.position.y !== y || card.three.position.z !== z)
						tl.to(card.three.position, {
							x : x,
							y : y,
							z : z,
							duration : 0.15
						}, 0);
				});
				result += 150;
			} else if (location === LOCATION.DECK && animation) {
				const len = three.cards.map.get(location)![owner].length - 1
				if (len > 0) {
					const ct = Math.max(Math.floor(len / -2), -4);
					for (let v = 0; v < 4; v ++) {
						const card = three.cards.map.get(location)![owner][len];
						tl.to(card.three.position, {
							x : `${!!owner ? '+' : '-'}=${three.create.size.width}px`,
							duration : 0.05
						}, 0 + v * 0.2);
						const z = Math.floor(len / 2) * three.create.size.top;
						tl.to(card.three.position, {
							z : z,
							duration : 0.05
						}, 0.05 + v * 0.2);
						tl.to(card.three.position, {
							x : `${!!owner ? '-' : '+'}=${three.create.size.width}px`,
							duration : 0.05
						}, 0.1 + v * 0.2);
						tl.to(card.three.position, {
							z : len * three.create.size.top,
							duration : 0.05
						}, 0.15 + v * 0.2);
					}
					result += ct * 200;
				}
			} else {
				three.cards.map.get(location)![owner].forEach((card, v) => {
					const z = v * three.create.size.top;
					if (card.three.position.z !== z)
						tl.to(card.three.position, {
							z : z,
							duration : 0.05
						}, 0);
				});
				result += 50;
			}
			tl.then(() => tl.kill());
			return result;
		},
		rotate : (target : Client_Card, from : number, owner : number, pos : number = POS.NONE) => {
			const move = () => {
				const tl = gsap.timeline();
				if (owner === 1)
					tl.to(target.three.rotation, {
						z : Math.PI,
						duration : 0.2
					})
				const pic = target.pic ?? three.src.unknown;
				const img = target.div.img;
				switch (pos) {
					case POS.FACEDOWN_ATTACK:
						if (img.src !== three.src.cover)
							gsap.turn(img, three.src.cover, tl);
						gsap.pos(img, pos, tl);
						break;
					case POS.FACEDOWN_DEFENSE:
						if (img.src !== three.src.cover)
							gsap.turn(img, three.src.cover, tl);
						gsap.pos(img, pos, tl);
						break;
					case POS.FACEUP_ATTACK:
						if (img.src !== pic)
							gsap.turn(img, pic, tl);
						gsap.pos(img, pos, tl);
						break;
					case POS.FACEUP_DEFENSE:
						if (img.src !== pic)
							gsap.turn(img, pic, tl);
						gsap.pos(img, pos, tl);
						break;
				}
				tl.then(() => tl.kill());
			};
			const set = () => {
				if (owner === 1)
					target.three.rotation.set(0, 0, Math.PI);
				const el = target.div.img;
				switch (pos) {
					case POS.FACEDOWN_ATTACK:
						el.src = three.src.cover;
						break;
					case POS.FACEDOWN_DEFENSE:
						el.src = three.src.cover;
						break;
					case POS.FACEUP_ATTACK:
						el.src = target.pic ?? three.src.unknown;
						break;
					case POS.FACEUP_DEFENSE:
						el.src = target.pic ?? three.src.unknown;
						break;
				}
			};
			target.update.pos(pos);
			!!from ? move() : set();
		}
	}

	const duel = {
		cards : new Map([
			[LOCATION.HAND, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return three.cards.map.get(LOCATION.HAND)!.flat();
				return three.cards.map.get(LOCATION.HAND)![tp];
			}],
			[LOCATION.DECK, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return three.cards.map.get(LOCATION.DECK)!.flat();
				return three.cards.map.get(LOCATION.DECK)![tp];
			}],
			[LOCATION.EXTRA, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return three.cards.map.get(LOCATION.EXTRA)!.flat();
				return three.cards.map.get(LOCATION.EXTRA)![tp];
			}],
			[LOCATION.FZONE, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return three.cards.map.get(LOCATION.FZONE)!.flat();
				return three.cards.map.get(LOCATION.FZONE)![tp];
			}],
			[LOCATION.GRAVE, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return three.cards.map.get(LOCATION.GRAVE)!.flat();
				return three.cards.map.get(LOCATION.GRAVE)![tp];
			}],
			[LOCATION.REMOVED, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return three.cards.map.get(LOCATION.REMOVED)!.flat();
				return three.cards.map.get(LOCATION.REMOVED)![tp];
			}],
			[LOCATION.MZONE, (tp : number, seq : number = -1) : Array<Client_Card> => {
				const group : Array<Client_Card> = [];
				for (const p of tp === 2 ? [0, 1] : [tp])
					if (seq <= -1)
						for (let i = 0; i < 7; i ++) {
							const len = three.cards.map.get(LOCATION.MZONE | (i << 16))![tp].length;
							group.push(three.cards.map.get(LOCATION.MZONE | (i << 16))![p][len - 1]);
						}
					else {
						const len = three.cards.map.get(LOCATION.MZONE | (seq << 16))![tp].length;
						group.push(three.cards.map.get(LOCATION.MZONE | (seq << 16))![p][len - 1]);
					}
				return group.filter(i => i !== undefined);
			}],
			[LOCATION.OVERLAY, (tp : number, seq : number) : Array<Client_Card> => {
				return three.cards.map.get(LOCATION.MZONE | (seq << 16))![tp].slice(0, -1);
			}],
			[LOCATION.SZONE, (tp : number, seq : number = -1) : Array<Client_Card> => {
				const group : Array<Client_Card> = [];
				for (const p of tp === 2 ? [0, 1] : [tp])
					if (seq <= -1) {
						for (let i = 0; i < 5; i ++) {
							const len = three.cards.map.get(LOCATION.SZONE | (i << 16))![tp].length;
							group.push(three.cards.map.get(LOCATION.SZONE | (i << 16))![p][len - 1]);
						}
						group.push(...duel.cards.get(LOCATION.FZONE)!(tp));
					} else if (seq === 5)
						return three.cards.map.get(LOCATION.FZONE)![tp];
					else {
						if (seq === 6) seq = 0;
						else if (seq === 7) seq = 4;
						const len = three.cards.map.get(LOCATION.SZONE | (seq << 16))![tp].length;
						group.push(three.cards.map.get(LOCATION.SZONE | (seq << 16))![p][len - 1]);
					}
				return group.filter(i => i !== undefined);
			}],
			[LOCATION.PZONE, (tp : number) : Array<Client_Card> => {
				const group : Array<Client_Card> = [];
				for (const p of tp === 2 ? [0, 1] : [tp])
					for (const i of [0, 4]) {
						const len = three.cards.map.get(LOCATION.SZONE | (i << 16))![p].length;
						group.push(three.cards.map.get(LOCATION.SZONE | (i << 16))![p][len - 1]);
					}
				return group.filter(i => i !== undefined);
			}],
			[LOCATION.ONFIELD, (tp : number) : Array<Client_Card> => {
				if (tp === 2)
					return duel.cards.get(LOCATION.MZONE)!(0).concat(
						duel.cards.get(LOCATION.SZONE)!(0),
						duel.cards.get(LOCATION.MZONE)!(1),
						duel.cards.get(LOCATION.SZONE)!(1)
					);
				return duel.cards.get(LOCATION.MZONE)!(tp).concat(duel.cards.get(LOCATION.SZONE)!(tp));
			}],
			[LOCATION.ALL, (tp : number) : Array<Client_Card> => {
				return Array.from(three.cards.map).map((i) => {
					return i[0] === LOCATION.PZONE ? [] : tp === 2 ? i[1].flat() : i[1][tp];
				}).flat();
			}]
		]) as Map<number, Function>,
		plaid : {
			get : (place : number) : Plaids => {
				const plaids = three.plaids.filter(i => (i.loc & place) > 0);
				const array : Plaids = [];
				for (const i of plaids) {
					const cards : Array<Client_Card> | undefined = i.seq[1] < 2 ? (three.cards.map.get(i.seq[0])?? [undefined, undefined])[i.seq[1]]
						: (() : Array<Client_Card> | undefined => {
							const result = three.cards.map.get(i.seq[1]);
							if (!result)
								return undefined;
							return result.flat();
						})();
					if (cards) {
						const card = cards[cards.length - 1];
						array.push({ plaid : i, card : card?.code, pos : card?.pos });
						continue;
					}
					array.push({ plaid : i });
				}
				return array;
			}
		},
		draw : async (tp : number, ct : number) => {
			const len = three.cards.map.get(LOCATION.DECK)![tp].length - 1;
			for (let i = len; i > len - ct; i --) {
				if (len - ct < 0)
					break;
				const card = three.cards.map.get(LOCATION.DECK)![tp][i];
				three.create.send.to(card, tp, LOCATION.HAND, LOCATION.DECK);
				await mainGame.sleep(150);
			}
		},
		to : {
			chk : (i : Card_From) : void => {
				if (i.location === (LOCATION.SZONE | (5 << 16)))
					i.location = LOCATION.FZONE;
			},
			none : async (tp : number, from_to : Array<Card_From> | Card_From, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					three.create.send.to(card, to_tp, LOCATION.NONE, i.location);
					await mainGame.sleep(200);
				}
			},
			mzone : async (tp : number, from_to : Array<Card_From> | Card_From, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					const loc = LOCATION.MZONE | (i.zone << 16);
					three.create.send.to(card, to_tp, loc, i.location, three.cards.map.get(loc)![tp].length, i.pos);
					await mainGame.sleep(150);
				}
			},
			szone : async (tp : number, from_to : Array<Card_From> | Card_From, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					if (i.zone === 5) {
						await duel.to.fzone(tp, i, to_tp);
						continue;
					} else {
						const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
						const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
						if ((card.type & TYPE.PENDULUM) === TYPE.PENDULUM && [0, 4].includes(i.zone)) {
							i.zone = i.zone === 0 ? 0 : 1;
							await duel.to.pzone(tp, i, to_tp);
						} else {
							const loc = LOCATION.SZONE | (i.zone << 16);
							three.create.send.to(card, to_tp, loc, i.location, three.cards.map.get(loc)![tp].length, ((i.pos ?? 0) & POS.FACEDOWN) > 0 ? POS.FACEDOWN_ATTACK : POS.FACEUP_ATTACK);
							await mainGame.sleep(150);
						}
					}
				}
			},
			fzone : async (tp : number, i : Card_From, to_tp : number = tp) => {
				duel.to.chk(i);
				const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
				three.create.send.to(card, to_tp, LOCATION.FZONE, i.location, three.cards.map.get(LOCATION.FZONE)![tp].length, ((i.pos ?? 0) & POS.FACEDOWN) > 0 ? POS.FACEDOWN_ATTACK : POS.FACEUP_ATTACK);
				await mainGame.sleep(150);
			},
			grave : async (tp : number, from_to : Array<Card_From> | Card_From, seq : number, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					three.create.send.to(card, to_tp, LOCATION.GRAVE, i.location, seq, POS.FACEUP_ATTACK);
					await mainGame.sleep(150);
				}
			},
			removed : async (tp : number, from_to : Array<Card_From> | Card_From, seq : number, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					three.create.send.to(card, to_tp, LOCATION.REMOVED, i.location, seq, ((i.pos ?? 0) & POS.FACEDOWN) > 0 ? POS.FACEDOWN_ATTACK : POS.FACEUP_ATTACK);
					await mainGame.sleep(150);
				}
			},
			pzone : async (tp : number, from_to : Array<Card_From> | Card_From, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					const loc = LOCATION.PZONE | (i.zone << 16)
					three.create.send.to(card, to_tp, loc, i.location, three.cards.map.get(loc)![tp].length, POS.FACEUP_ATTACK);
					await mainGame.sleep(150);
				}
			},
			deck : async (tp : number, from_to : Array<Card_From> | Card_From, seq : number, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					three.create.send.to(card, to_tp, LOCATION.DECK, i.location, seq, POS.FACEDOWN_ATTACK);
					await mainGame.sleep(150);
				}
			},
			extra : async (tp : number, from_to : Array<Card_From> | Card_From, seq : number, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					three.create.send.to(card, to_tp, LOCATION.EXTRA, i.location, seq, ((i.pos ?? POS.FACEDOWN) & POS.FACEDOWN) > 0 ? POS.FACEDOWN_ATTACK : POS.FACEUP_ATTACK);
					await mainGame.sleep(150);
				}
			},
			overlay : async (tp : number, from_to : Array<Card_From> | Card_From, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					const loc = LOCATION.MZONE | (i.zone << 16)
					const len = three.cards.map.get(loc)![tp].length - 1;
					three.create.send.to(card, to_tp, loc, i.location, len, (three.cards.map.get(loc)![tp][len].pos & POS.ATTACK) > 0 ? POS.FACEUP_DEFENSE : POS.FACEUP_ATTACK);
					await mainGame.sleep(150);
				}
			},
			hand : async (tp : number, from_to : Array<Card_From> | Card_From, to_tp : number = tp) => {
				for (const i of Array.isArray(from_to) ? from_to as Array<Card_From> : [from_to as Card_From]) {
					duel.to.chk(i);
					const cards : Array<Client_Card> = three.cards.map.get(i.location)![tp];
					const card = cards[i.seq >= 0 ? i.seq : cards.length - 1];
					three.create.send.to(card, to_tp, LOCATION.HAND, i.location);
					await mainGame.sleep(150);
				}
			}
		},
		add : {
			card : async (owner : number, loc : number, seq : number, code : number) => {
				three.add.card(owner, loc, seq, mainGame.get.card(code).pic)
				await mainGame.sleep(200);
			}
		},
		sort : {
			deck : async (tp : number) : Promise<void> => {
				const ct = three.sort(tp, LOCATION.DECK, true);
				await mainGame.sleep(ct);
			},
			hand  : async (tp : number, hands : Array<number>) : Promise<void> => {
				const sort = (a : Array<Client_Card>, b : Array<number>) : Array<Client_Card> => {
					const groups = new Map<number, Array<Client_Card>>();
					a.forEach(i => {
						if (!groups.has(i.code))
							groups.set(i.code, []);
						groups.get(i.code)!.push(i);
					});
					
					const pointers = new Map();
					groups.forEach((_, code) => pointers.set(code, 0));
					
					const result : Array<Client_Card> = [];
					b.forEach(code => {
						const group = groups.get(code);
						const pointer = pointers.get(code);
						
						if (group && pointer < group.length) {
							result.push(group[pointer]);
							pointers.set(code, pointer + 1);
						}
					});
					
					return result;
				}
				hover.show_off();
				three.cards.map.get(LOCATION.HAND)![tp] = sort(three.cards.map.get(LOCATION.HAND)![tp], hands)
				const ct = three.sort(tp, LOCATION.HAND);
				await mainGame.sleep(ct);
			},
		},
		attack : async (
			attacker : { owner : number; location : number; seq : number; },
			defender : { owner : number; location : number; seq : number; }
		) => {
			const cards = three.cards.map.get(attacker.location | (attacker.seq << 16))![attacker.owner];
			const a = {
				card : cards[cards.length - 1],
				loc : three.axis.computed(attacker.owner, attacker.location | (attacker.seq << 16), cards.length - 1)
			};
			const d = !!defender.location ? (() => {
				const cards = three.cards.map.get(defender.location | (defender.seq << 16))![defender.owner];
				return {
					card : cards[cards.length - 1],
					loc : three.axis.computed(defender.owner, defender.location | (defender.seq << 16), cards.length - 1)
				};
			})() : {
				loc : [0, 3.5 * (three.create.size.height + three.create.gap) * (!!attacker.owner ? - 1 : 1), 10]
			};
			const [tl, time] = gsap.attack(a, d, three.create.size, attacker.owner, (attacker.seq > 4 ? attacker.seq - 4 : attacker.seq) - (defender.seq > 4 ? defender.seq - 4 : defender.seq));
			tl.then(() => tl.kill());
			await mainGame.sleep(time);
		},
		confirm : {
			hand : async (cards : Array<Client_Card>, codes : Array<number>) : Promise<void> => {
				const [tl, ct] = gsap.confirm.hand(cards, codes.map(i => mainGame.get.card(i).pic), three.src.cover);
				tl.then(() => tl.kill());
				await mainGame.sleep(ct);
				await mainGame.sleep(three.sort(1, LOCATION.HAND));
			}
		},
		repos : async (card : Client_Card, tp : number, loc : number, pos : number) : Promise<void> => {
			if (!!(pos & POS.FACEDOWN)) {
				card.show.counter.off();
				card.show.atk.off();
				card.show.info.off();
			} else {
				const len = three.cards.map.get(loc)![tp].length - 1;
				card.show.info.on(len);
				card.show.atk.on();
			}
			three.cards.map.get(loc)![tp].slice(0, -1).forEach(card => {
				card.show.info.off();
				card.show.atk.off();
				card.show.counter.off();
				//超量素材和怪兽方向垂直
				three.rotate(card, loc, tp, (pos & POS.ATTACK) > 0 ? POS.FACEUP_DEFENSE : POS.FACEUP_ATTACK);
			});
			three.rotate(card, loc, tp, pos);
			await mainGame.sleep(200);
		},
		swap : async (
			a : { tp : number; loc : number; seq : number; },
			b : { tp : number; loc : number; seq : number; }
		) : Promise<void> => {
			const group_a = three.cards.map.get(a.loc | (a.seq << 16))![a.tp];
			three.cards.map.get(a.loc | (a.seq << 16))![a.tp] = three.cards.map.get(b.loc | (b.seq << 16))![b.tp];
			three.cards.map.get(b.loc | (b.seq << 16))![b.tp] = group_a;
			three.cards.map.get(b.loc | (b.seq << 16))![b.tp].forEach((card, v) => {
				const [x, y, z] = three.axis.computed(b.tp, b.loc | (b.seq << 16), v);
				three.move(card.three, a.loc, a.tp, x, y, z);
				three.rotate(card, a.loc, a.tp);
			});
			three.cards.map.get(a.loc | (a.seq << 16))![a.tp].forEach((card, v) => {
				const [x, y, z] = three.axis.computed(a.tp, a.loc | (a.seq << 16), v);
				three.move(card.three, b.loc, b.tp, x, y, z);
				three.rotate(card, b.loc, b.tp);
			});
			await mainGame.sleep(200);
		}
	};

	onMounted(async () => {
		emit('update:duel', duel);
		three.axis.map.set(LOCATION.PZONE | (0 << 16), three.axis.map.get(LOCATION.SZONE | (0 << 16))!);
		three.axis.map.set(LOCATION.PZONE | (1 << 16), three.axis.map.get(LOCATION.SZONE | (4 << 16))!);
		three.cards.map.set(LOCATION.PZONE | (0 << 16), three.cards.map.get(LOCATION.SZONE | (0 << 16))!);
		three.cards.map.set(LOCATION.PZONE | (1 << 16), three.cards.map.get(LOCATION.SZONE | (4 << 16))!);
		three.create.size.width = three.create.size.height / 1.45;
		three.create.offset = three.create.size.height / 1.5;
		three.renderer.setSize(window.innerWidth * 0.9, window.innerHeight);
		three.renderer.domElement.style.position = 'fixed';
  		three.renderer.domElement.style.top = '0';
		three.camera.position.set(0, -300, 630);
		three.camera.lookAt(0, -60, 0);

		three.add.back();
		for (let x = -3; x < 4; x++)
			for (let y = -2; y < 3; y++)
				if (y !== 0 || x % 2 !== 0)
    				three.add.plaid(x, y);
		three.add.btn();

		const deck_axis : Array<Position | undefined> = [
			{ loc : LOCATION.DECK, owner : 0 },
			{ loc : LOCATION.EXTRA, owner : 0 },
			undefined,
			{ loc : LOCATION.DECK, owner : 1 },
			{ loc : LOCATION.EXTRA, owner : 1 }
		];
		for (const [v, ct] of props.connect.deck_count.entries())
			for (let z = 0; z < ct; z++)
				if (deck_axis[v] !== undefined)
					three.add.card(deck_axis[v].owner, deck_axis[v].loc, z);

		const ambientLight = new THREE.AmbientLight('white', 1);
		three.scene.add(ambientLight);

		three.render();
		canvas.value!.appendChild(three.renderer.domElement);
		const animate = () => {
			requestAnimationFrame(animate);
			three.render();
		}

		animate();

			// await duel.draw(0, 8);
			// await duel.draw(1, 8);
			// await duel.to.mzone(0, {
			// 	location : LOCATION.DECK,
			// 	seq : 0,
			// 	zone : 0
			// })

			

		window.addEventListener('resize', three.resize);
		window.addEventListener('click', hover.click);

		if (props.connect.promise)
			props.connect.promise();
	});

	onUnmounted(() => {
		window.removeEventListener('resize', three.resize);
		window.removeEventListener('click', hover.click);
	});

	const props = defineProps(['connect']);
	const emit = defineEmits(['update:duel']);

	watch(() => { return props.connect.phase.phase; }, async (n) => {
		hover.show_off();
		await three.btn?.phase(n);
	});

</script>
<style scoped lang = 'scss'>
	.canvas {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
	}
</style>