import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';

import Card from '@/script/card';
import { FILES, KEYS } from '@/script/constant';
import mainGame from '@/script/game';
import { LOCATION, POS } from '@/script/ygo-protocol/network';

import { duel } from './scene';
import * as SIZE from './scene-size';
import Axis from './axis';

class Client_Card {
	three : CSS.CSS3DObject;
	location : number;
	owner : number;
	seq : number;
	pos : number;
	id : number;
	alias : number;
	card ?: Card;
	pic ?: string;
	type : number;
	level : number;
	rank : number;
	link : number;
	attribute : number;
	race : number;
	atk : number;
	def : number;
	scale : number;
	overlay : number;

	constructor () {
		this.owner = 0;
		this.location = 0;
		this.seq = 0;
		this.id = 0;
		this.alias = 0;
		this.card = undefined;
		this.pic = undefined;
		this.alias = 0;
		this.type = 0;
		this.level = 0;
		this.rank = 0;
		this.link = 0;
		this.attribute = 0;
		this.race = 0;
		this.atk = 0;
		this.def = 0;
		this.scale = 0;
		this.overlay = 0;
		this.pos = 0;
		this.three = this.init.on();
	};

	init = {
		on : () : CSS.CSS3DObject => {
			const dom = document.createElement('div');
			Object.assign(dom.style, {
				opacity : '0',
				fontFamily : 'AtkDef',
				color : 'white',
				transition : 'all 0.2s ease'
			});
			dom.appendChild(this.init.img(mainGame.back.pic));
			dom.appendChild(this.init.atk());
			dom.appendChild(this.init.info());
			dom.appendChild(this.init.counter());
			dom.appendChild(this.init.btn());
			if (this.location !== LOCATION.NONE)
				dom.style.opacity = '1';
			return new CSS.CSS3DObject(dom);
		},
		img : (src : string) : HTMLImageElement => {
			const child = document.createElement('img');
			child.src = src;
			Object.assign(child.style, {
				width : `${SIZE.WIDTH}px`,
				height : `${SIZE.HEIGHT}px`,
				transition : 'all 0.2s ease'
			});
			// child.addEventListener('mouseenter', hover.on.bind(null, this));
			// child.addEventListener('mouseout', hover.end.bind(null, this));
			return child;
		},
		atk : () : HTMLDivElement => {
			const child = document.createElement('div');
			child.innerText = '';
			Object.assign(child.style, {
				backgroundColor : 'rgba(0, 0, 0, 0.3)',
				opacity : '0',
				position : 'absolute',
				bottom : '0',
				left : `-${(SIZE.HEIGHT - SIZE.WIDTH) / 2}px`,
				width : `${SIZE.HEIGHT}px`,
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				display : 'flex',
				justifyContent : 'center',
				transition : 'all 0.2s ease',
				userSelect: 'none'
			});
			return child;
		},
		info : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '1',
				position : 'absolute',
				bottom : '40px',
				left : '-10px',
				height : '16px',
				width : `${SIZE.HEIGHT}px`,
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				fontFamily : 'AtkDef',
				transition : 'all 0.2s ease',
				userSelect : 'none',
				pointerEvents : 'none'
			});
			for (const i of [
				KEYS.LINK,
				KEYS.RANK,
				KEYS.OVERLAY,
				KEYS.SCALE,
				KEYS.TUNER,
				KEYS.LEVEL
			]) {
				const div = document.createElement('div');
				div.classList.add(i);
				Object.assign(div.style, {
					height : '100%',
					width : '28px',
					position : 'absolute',
					display : 'flex',
					opacity : '0',
					transition : 'all 0.2s ease'
				});
				const img = document.createElement('img');
				img.src = mainGame.get.textures(KEYS.INFO, i) as string;
				img.style.height = '100%';
				div.appendChild(img);
				const span = document.createElement('span');
				span.style.transition = 'all 0.1s ease';
				span.innerText = '';
				if (i === KEYS.TUNER)
					span.style.color = 'lightgreen';
				div.appendChild(span);
				child.appendChild(div);
			}
			return child;
		},
		counter : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '1',
				position : 'absolute',
				bottom : '20px',
				left : '-10px',
				height : '16px',
				width : `${SIZE.HEIGHT}px`,
				color : 'white',
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				fontFamily : 'AtkDef',
				alignItems: 'center',
				transition : 'all 0.2s ease',
				userSelect: 'none'
			});
			return child;
		},
		btn : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '1',
				height : '48px',
				minWidth : '0px',
				display : 'none',
				gap : '2px',
				justifyContent: 'center',
				position : 'absolute',
				top : '0px',
				left : '50%',
				transform: 'translateX(-50%)',
				transition : 'all 0.2s ease'
			});
			for (const i of [
				KEYS.ACTIVATE,
				KEYS.ATTACK,
				KEYS.MSET,
				KEYS.SSET,
				KEYS.POS_ATTACK,
				KEYS.POS_DEFENCE,
				KEYS.FLIP,
				KEYS.SUMMON,
				KEYS.PSUMMON,
				KEYS.SPSUMMON,
				KEYS.SCALE,
			]) {
				const img = document.createElement('img');
				img.classList.add(i[0]);
				img.classList.add('btn');
				Object.assign(img.style, {
					height : '100%',
					display : 'none'
				});
				const srcs = mainGame.get.textures(KEYS.BTN, i[1]) as [string, string];
				img.src = srcs[0];
				img.addEventListener('mouseenter', () => {
					img.src = srcs[1];
				});
				img.addEventListener('mouseout', () => {
					img.src = srcs[0];
				});
				// img.addEventListener('click', async () => {
				// 	await hover.response(this, ['pos_attack', 'pos_defence', 'filp'].includes(key) ? 'repos' : key);
				// });
				child.appendChild(img);
			}
			return child;
		}
	};

	get = {
		el : {
			img : () : HTMLImageElement => this.three.element.children[0] as HTMLImageElement,
			atk : () : HTMLDivElement => this.three.element.children[1] as HTMLDivElement,
			info : () : HTMLDivElement => this.three.element.children[2] as HTMLDivElement,
			counter : () : HTMLDivElement => this.three.element.children[3] as HTMLDivElement,
			btn : () : HTMLDivElement => this.three.element.children[4] as HTMLDivElement,
		}
	};

	set = {
		owner : (owner : number) : gsap.core.Tween | void => {
			if (this.owner === owner) return;
			this.owner = owner;
			return gsap.to(this.three.rotation, {
				z : this.owner * Math.PI,
				duration : 0.2
			});
		},
		pos : (pos : number) : gsap.core.Timeline | void => {
			if (this.pos === pos) return;
			const img = this.get.el.img();
			if (this.pos === POS.NONE) {
				this.pos = pos;
				switch (pos) {
					case POS.FACEDOWN_ATTACK:
						img.src = mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string;
						break;
					case POS.FACEDOWN_DEFENSE:
						img.src = mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string;
						break;
					case POS.FACEUP_ATTACK:
						img.src = this.pic ?? mainGame.unknown.pic;
						break;
					case POS.FACEUP_DEFENSE:
						img.src = this.pic ?? mainGame.unknown.pic;
						break;
				}
			} else {
				const tl = gsap.timeline();
				const turn = (el : HTMLImageElement, pic : string) => {
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
					}, 0.125);
					tl.to(el, {
						rotationY : 0,
						duration : 0.1
					}, 0.125);
				}
				if ((pos & POS.FACEDOWN) && !(this.pos & POS.FACEDOWN))
					turn(img, mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string);
				else if ((pos & POS.FACEUP) && !(this.pos & POS.FACEUP))
					turn(img, this.pic ?? mainGame.unknown.pic);
				if ((pos & POS.ATTACK) && !(this.pos & POS.ATTACK))
					tl.to(img, {
						rotationZ : 0,
						duration : 0.1,
					}, 0);
				else if ((pos & POS.DEFENSE) && !(this.pos & POS.DEFENSE))
					tl.to(img, {
						rotationZ : - 90,
						duration : 0.1,
					}, 0);
				this.pos = pos;
				return tl;
			}
		},
		location : (location : number, seq : number) : gsap.core.Timeline | void => {
			if (this.location === location && this.seq !== seq) return;
			if (this.location === LOCATION.NONE) {
				this.seq = seq;
				this.location = location;
				const axis = Axis.computed.card(this);
				this.three.position.set(...axis.get.xyz());
				this.three.element.style.opacity = '1';
			} else {
				this.seq = seq;
				this.location = location;
				if (location !== LOCATION.HAND) {
					const axis = Axis.computed.card(this);
					const tl = gsap.timeline();
					if (this.three.position.z < axis.z!) {
						tl.to(this.three.position, {
							z : axis.z,
							duration : 0.05
						});
						tl.to(this.three.position, {
							x : axis.x,
							y : axis.y,
							duration : 0.15
						}, 0.05);
					} else {
						tl.to(this.three.position, {
							x : axis.x,
							y : axis.y,
							duration : 0.15
						});
						tl.to(this.three.position, {
							z : axis.z,
							duration : 0.05
						}, 0.15);
					}
					return tl;
				}
			}
		},
		id : (id : number) : Client_Card => {
			if (id === 0)
				this.clear();
			const card = mainGame.get.card(id);
			this.id = id;
			this.set.pic(card.pic);
			this.card = card;
			this.alias = card.alias;
			this.pic = card.pic;
			this.type = card.type;
			this.level = (card.is_xyz() || card.is_link()) ? 0 : card.level;
			this.rank = card.is_xyz() ? card.level : 0;
			this.link = card.is_link() ? card.level : 0;
			this.attribute = card.attribute;
			this.atk = card.atk;
			this.def = card.def;
			this.scale = card.scale;
			return this;
		},
		pic : (pic : string) : Client_Card => {
			this.pic = pic;
			if (this.pos & POS.FACEUP)
				this.get.el.img().src = this.pic;
			return this;
		}
	};

	clear = () : void => {};
};

export default Client_Card;