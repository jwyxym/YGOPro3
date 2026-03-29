import { gsap } from 'gsap';

import { POS } from '@/pages/server/post/network';

import Client_Card from './client_card';

class Gsap {
	timeline = (vars : gsap.TimelineVars = {}) : gsap.core.Timeline => {
		return gsap.timeline(vars);
	};

	getProperty = gsap.getProperty

	to = gsap.to

	attack = (
		a : { card : Client_Card, loc : Array<number> },
		d : { card ?: Client_Card, loc : Array<number> },
		size : { width : number; height : number; },
		attack : number,
		gap : number,
		tl : gsap.core.Timeline = this.timeline()
	) : [gsap.core.Timeline, number] => {
		const direct = {
			x : d.loc[0] > a.loc[0] ? -1 : 1,
			y : d.loc[1] > a.loc[1] ? -1 : 1
		};
		const y = a.loc[1] - d.loc[1];
		const x = a.loc[0] - d.loc[0] + size.width * ((4 - Math.abs(gap)) / 5) * direct.x;
		let time = 0;
		//同y轴的怪兽发生战斗(额外怪兽区)
		if (y === 0) {
			tl.to(a.card.three.rotation, {
				z : Math.PI / (2 * direct.x),
				duration : 0.1,
			}, time);
			if (d.card)
				tl.to(d.card.three.rotation, {
					z : Math.PI / (2 * - direct.x),
					duration : 0.1,
				}, time);
			time += 0.1;
		//非同y轴的怪兽发生战斗
		} else {
			tl.to(a.card.three.rotation, {
				z : Math.atan(- x / y) + (!!attack ? Math.PI : 0),
				duration : 0.1,
			}, time);
			if (d.card)
				tl.to(d.card.three.rotation, {
					z : Math.atan(- x / y) + (!attack ? Math.PI: 0),
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
		if (d.loc[1] !== a.loc[1])
			Object.assign(move, {
				y : `+= ${20 * direct.y}`
			});
		tl.to(a.card.three.position, move, time);
		time += 0.1;
		//攻击
		move = {
			x : d.loc[0] + size.width * ((4 - Math.abs(gap)) / 5) * direct.x,
			z : d.loc[2] + 1,
			duration : 0.2,
		};
		if (d.loc[1] !== a.loc[1])
			Object.assign(move, {
				y : d.loc[1] + ((size.height / 2) * direct.y)
			});
		tl.to(a.card.three.position, move, time);
		time += 0.2;
		//受击
		if (d.card) {
			const move = {
				x : `+= ${40 * - direct.x}`,
				duration : 0.1,
			};
			if (d.loc[1] !== a.loc[1])
				Object.assign(move, {
					y : `+= ${40 * - direct.y}`
				});
			tl.to(d.card.three.position, move, time);
			time += 0.1;
		}
		//攻击的卡回到原位
		tl.to(a.card.three.rotation, {
			z : !!attack ? Math.PI : 0,
			duration : 0.1,
		}, time);
		tl.to(a.card.three.position, {
			x : a.loc[0],
			y : a.loc[1],
			z : a.loc[2],
			duration : 0.2,
		}, time);
		time += 0.1;
		//受击的卡回到原位
		if (d.card) {
			tl.to(d.card.three.rotation, {
				z : !attack ? Math.PI : 0,
				duration : 0.1,
			}, time);
			time += 0.1;
			tl.to(d.card.three.position, {
				x : d.loc[0],
				y : d.loc[1],
				z : d.loc[2],
				duration : 0.1,
			}, time);
		}
		return [tl, time * 1000];
	};

	opacity = (el : HTMLElement, to : number, complete : Function = () => {}) : gsap.core.Tween => {
		return gsap.to(el, {
			opacity: to,
			duration : 0.2,
			onComplete: () => { complete(); }
		});
	};

	pos = (el : HTMLImageElement, pos : number, tl : gsap.core.Timeline = this.timeline()) : gsap.core.Timeline => {
		tl.to(el, {
			rotationZ : (pos & POS.DEFENSE) > 0 ? -90 : 0,
			duration : 0.1,
		}, 0);
		return tl;
	};

	turn = (el : HTMLImageElement, pic : string | undefined, tl : gsap.core.Timeline = this.timeline(), time : number = 0) : [gsap.core.Timeline, number] => {
		tl.set(el, {
			rotationY : 0
		})
		tl.to(el, {
			rotationY : 90,
			duration : 0.1,
			onComplete: () => {
				el.src = pic ?? '';
			}
		}, time);
		time += 0.125;
		tl.set(el, {
			rotationY : -90
		}, time)
		tl.to(el, {
			rotationY : 0,
			duration : 0.1
		}, time);
		time += 0.1;
		return [tl, time];
	};

	confirm = {
		hand : (cards : Array<Client_Card>, codes : Array<string>, cover : string, tl : gsap.core.Timeline = this.timeline() ) : [gsap.core.Timeline, number] => {
			let time = 0;
			for (const [i, card] of cards.entries()) {
				let [_, v] = this.turn(card.div.img, codes[i], tl, time);
				time = v;
				tl.to(card.three.rotation, {
					z : 0,
					duration : 0.1,
				}, time);
				time += 0.1;
				const x = card.three.position.x;
				const y = card.three.position.y;
				tl.to(card.three.position, {
					x : 0,
					y : -200,
					z : '+=250',
					duration : 0.1,
				}, time);
				time += 0.4;
				tl.to(card.three.position, {
					x : x,
					y : y,
					z : '-=250',
					duration : 0.1,
				}, time);
				time += 0.1;
				tl.to(card.three.rotation, {
					z : Math.PI,
					duration : 0.1,
				}, time);
				time += 0.1;
				[_, v] = this.turn(card.div.img, cover, tl, time);
				time = v;
			}
			return [tl, time * 1000];
		},
	};
};

export default new Gsap();