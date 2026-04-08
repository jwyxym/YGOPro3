import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';
import lodash from 'lodash';

import Card, { TYPE } from '@/script/card';
import { KEYS } from '@/script/constant';
import mainGame from '@/script/game';

import * as SIZE from './scene-size';
import Axis from './axis';
import { duel } from './scene';

import connect from '../connect';
import { COMMAND, LOCATION, POS, STATUS } from '../ygo-protocol/network';

class Client_Card {
	three : CSS.CSS3DObject;
	location : number;
	owner : number;
	seq : number;
	pos : number;
	id : number;
	alias : number;
	card ?: Card;
	pic : string;
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
	status : number;
	activatable : Map<number, Array<{ desc ?: number; index : number; }>>;
	need_change = {
		type : false,
		activate : false,
		counter : false,
		status : false,
	};
	counter : Map<number, number>;
	clicked : boolean;

	constructor () {
		this.owner = 0;
		this.location = 0;
		this.seq = 0;
		this.id = 0;
		this.alias = 0;
		this.card = undefined;
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
		this.status = 0;
		this.pos = POS.FACEDOWN_ATTACK;
		this.three = this.init.on();
		this.pic = this.pos & POS.FACEDOWN ? mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string
			: mainGame.unknown.pic;
		this.activatable = new Map([
			[COMMAND.ACTIVATE, []],
			[COMMAND.SUMMON, []],
			[COMMAND.SPSUMMON, []],
			[COMMAND.SSET, []],
			[COMMAND.MSET, []],
			[COMMAND.REPOS, []],
			[COMMAND.ATTACK, []]
		]);
		this.counter = new Map();
		this.clicked = false;
	};

	init = {
		on : () : CSS.CSS3DObject => {
			const dom = document.createElement('div');
			Object.assign(dom.style, {
				opacity : '0',
				fontFamily : 'ATK',
				color : 'white',
				transition : 'all 0.2s ease'
			});
			dom.appendChild(this.init.img(mainGame.back.pic));
			dom.appendChild(this.init.atk());
			dom.appendChild(this.init.info());
			dom.appendChild(this.init.counter());
			dom.appendChild(this.init.btn());
			setTimeout(() => dom.style.opacity = '1', 0);
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
				left : `-${(SIZE.HEIGHT - SIZE.WIDTH) / 2}px`,
				height : '16px',
				width : `${SIZE.HEIGHT}px`,
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '18px',
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
					gap : '2px',
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
				left : `-${(SIZE.HEIGHT - SIZE.WIDTH) / 2}px`,
				height : '16px',
				width : `${SIZE.HEIGHT}px`,
				color : 'white',
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				alignItems: 'center',
				transition : 'all 0.2s ease',
				userSelect: 'none'
			});
			return child;
		},
		btn : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '0',
				height : '48px',
				minWidth : '0px',
				display : 'flex',
				gap : '2px',
				justifyContent: 'center',
				position : 'absolute',
				top : '0px',
				left : '50%',
				transform: 'translate(-50%, 0)',
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
				img.classList.add(i);
				img.classList.add('duel__card__btn');
				Object.assign(img.style, {
					height : '100%',
					opacity : '0',
					transition : 'all 0.1s ease',
					display : 'none',
					userSelect: 'initial'
				});
				const srcs = mainGame.get.textures(KEYS.BTN, i) as [string, string];
				img.src = srcs[0];
				img.addEventListener('mouseenter', () => img.src = srcs[1]);
				img.addEventListener('mouseout', () => img.src = srcs[0]);
				child.appendChild(img);
			}
			return child;
		}
	};

	get = {
		el : {
			img : () : HTMLImageElement => this.three.element.children[0] as HTMLImageElement,
			atk : () : HTMLDivElement => this.three.element.children[1] as HTMLDivElement,
			info : (query ?: string) : HTMLDivElement => query ? this.get.el.info().querySelector('.' + query) as HTMLDivElement
				: this.three.element.children[2] as HTMLDivElement,
			counter : () : HTMLDivElement => this.three.element.children[3] as HTMLDivElement,
			btn : (query ?: string) : HTMLDivElement => query ? this.get.el.btn().querySelector('.' + query) as HTMLDivElement
				: this.three.element.children[4] as HTMLDivElement,
		},
		activate : (key : string) : Array<{ desc ?: number; index : number; }> => {
			switch (key) {
				case KEYS.ACTIVATE:
					return this.activatable
						.get(COMMAND.ACTIVATE)
						?.filter(i => i.desc !== 1160) ?? [];
				case KEYS.SCALE:
					return this.activatable
						.get(COMMAND.ACTIVATE)
						?.filter(i => i.desc === 1160) ?? [];
				case KEYS.ATTACK:
					return this.activatable
						.get(COMMAND.ATTACK) ?? [];
				case KEYS.MSET:
					return this.activatable
						.get(COMMAND.MSET) ?? [];
				case KEYS.SSET:
					return this.activatable
						.get(COMMAND.SSET) ?? [];
				case KEYS.POS_ATTACK:
				case KEYS.POS_DEFENCE:
				case KEYS.FLIP:
					return this.activatable
						.get(COMMAND.REPOS) ?? [];
				case KEYS.SPSUMMON:
				case KEYS.PSUMMON:
					return this.activatable
						.get(COMMAND.SPSUMMON) ?? [];
				case KEYS.SUMMON:
					return this.activatable
						.get(COMMAND.SUMMON) ?? [];
				default: return [];
			}
		}
	};

	set = {
		owner : (owner : number) : Client_Card => {
			this.owner = owner;
			return this;
		},
		pos : (pos : number) : Client_Card => {
			if (this.pos === pos) return this;
			this.pos = pos;
			return this;
		},
		location : (location : number) : Client_Card => {
			this.location = location;
			return this;
		},
		seq : (seq : number) : Client_Card => {
			this.seq = seq;
			return this;
		},
		id : (id : number) : Client_Card => {
			if (!id)
				this.clear.self();
			const card = mainGame.get.card(id);
			this.id = id;
			this.set.pic(card.pic);
			return this;
		},
		alias : (alias : number) : Client_Card => {
			this.alias = alias;
			return this;
		},
		pic : (pic : string) : Client_Card => {
			this.pic = pic;
			if (this.pos & POS.FACEUP)
				this.get.el.img().src = this.pic;
			return this;
		},
		atk : (atk : number) : Client_Card => {
			this.atk = atk;
			return this;
		},
		def : (def : number) : Client_Card => {
			this.def = def;
			return this;
		},
		type : (type : number) : Client_Card => {
			if (!this.need_change.type)
				this.need_change.type = this.type !== type;
			this.type = type;
			return this;
		},
		level : (level : number) : Client_Card => {
			if (!this.need_change.type)
				this.need_change.type = this.level !== level;
			this.level = level;
			return this;
		},
		rank : (rank : number) : Client_Card => {
			if (!this.need_change.type)
				this.need_change.type = this.rank !== rank;
			this.rank = rank;
			return this;
		},
		scale : (scale : number) : Client_Card => {
			if (!this.need_change.type)
				this.need_change.type = this.scale !== scale;
			this.scale = scale;
			return this;
		},
		link : (link : number) : Client_Card => {
			if (!this.need_change.type)
				this.need_change.type = this.link !== link;
			this.link = link;
			return this;
		},
		overlay : (overlay : number) : Client_Card => {
			if (!this.need_change.type)
				this.need_change.type = this.overlay !== overlay;
			this.rank = overlay;
			return this;
		},
		attribute : (attribute : number) : Client_Card => {
			this.attribute = attribute;
			return this;
		},
		race : (race : number) : Client_Card => {
			this.race = race;
			return this;
		},
		counter : (ctype : number, ccount : number, add : boolean = true) : Client_Card => {
			this.need_change.counter = true;
			const ct = this.counter.get(ctype);
			ct ? this.counter.set(ctype, add ? ct + ccount : ct)
				: this.counter.set(ctype, Math.max(0, ccount));
			return this;
		},
		activate : (flag : number, index : number, desc ?: number) => {
			this.need_change.activate = true;
			this.activatable
				.get(flag)?.push({ index : index, desc : desc});
		},
		status : (status : number) : Client_Card => {
			if (!this.need_change.status)
				this.need_change.status = this.status !== status;
			this.status = status;
			return this;
		}
	};

	update = async () : Promise<void> => {
		const status = async () : Promise<void> => {
			if (!this.need_change.status)
				return;
			this.need_change.status = false;
			const style = this.get.el.img().style;
			if (!this.status)
				style.filter = 'initial';
			else if (this.status & (STATUS.DISABLED | STATUS.FORBIDDEN))
				style.filter = 'grayscale(100%)';
			await mainGame.sleep(200);
		}
		const activate = async () : Promise<void> => {
			if (!this.need_change.activate)
				return;
			this.need_change.activate = false;
			const style = this.get.el.img().style;
			style.boxShadow = (() => {
				const cards = duel.get.cards()
					.filter(i => i.location & this.location && i.owner === this.owner);
				const seq = cards.length - 1;
				if ((this.location & (LOCATION.EXTRA | LOCATION.DECK | LOCATION.GRAVE | LOCATION.REMOVED))
					&& this.seq !== seq)
					return 'initial';
				const some = this.location & (LOCATION.HAND | LOCATION.ONFIELD) ?
					(i : number) : boolean => !!this.activatable.get(i)?.length
					: (i : number) : boolean => !!lodash.sumBy(cards.map(c => c.activatable.get(i)!), i => i.length)

				if ([COMMAND.ACTIVATE, COMMAND.SPSUMMON]
					.some(some))
					return '0 0 8px yellow';
				else if ([COMMAND.SSET, COMMAND.MSET, COMMAND.REPOS, COMMAND.ATTACK, COMMAND.SUMMON]
					.some(some))
					return '0 0 8px rgba(119, 166, 255, 1)';
				else return 'initial';
			})();
			await mainGame.sleep(100);
		};
		const activate_btn = async () : Promise<void> => {
			if (!this.need_change.activate)
				return;
			this.need_change.activate = false;
			const ACTIVATE = this.activatable.get(COMMAND.ACTIVATE)!;
			const SUMMON = this.activatable.get(COMMAND.SUMMON)!;
			const SPSUMMON = this.activatable.get(COMMAND.SPSUMMON)!;
			const SSET = this.activatable.get(COMMAND.SSET)!;
			const MSET = this.activatable.get(COMMAND.MSET)!;
			const REPOS = this.activatable.get(COMMAND.REPOS)!;
			const ATTACK = this.activatable.get(COMMAND.ATTACK)!;
			const elements : Array<[HTMLDivElement, number]> = [];
			const is_pendulum = (this.location & LOCATION.SZONE) && [0, 4].includes(this.seq) && this.type & TYPE.PENDULUM;

			elements.push([this.get.el.btn(KEYS.SCALE), Number(!!ACTIVATE.find(i => i.desc === 1160))]);
			elements.push([this.get.el.btn(KEYS.ACTIVATE), Number(!!ACTIVATE.find(i => i.desc !== 1160))]);
			elements.push([this.get.el.btn(KEYS.SUMMON), Number(!!SUMMON.length)]);
			elements.push([this.get.el.btn(KEYS.PSUMMON), is_pendulum ? Number(!!SPSUMMON.length) : 0]);
			elements.push([this.get.el.btn(KEYS.SPSUMMON), is_pendulum ? 0 : Number(!!SPSUMMON.length)]);
			elements.push([this.get.el.btn(KEYS.SSET), Number(!!SSET.length)]);
			elements.push([this.get.el.btn(KEYS.MSET), Number(!!MSET.length)]);
			elements.push([this.get.el.btn(KEYS.FLIP), Number(!!REPOS.length)]);
			elements.push([this.get.el.btn(KEYS.ATTACK), Number(!!ATTACK.length)]);
			elements.forEach(i => i[0].style.opacity = '0');
			await mainGame.sleep(100);
		};
		const counter = () : gsap.core.Timeline | void => {
			if (!this.need_change.counter) return;
			this.need_change.counter = false;
			const tl = gsap.timeline();
			const create_counter = (counter : number) => {
				const div = document.createElement('div');
				//为指示物div设置class，class为指示物编号
				div.classList.add(`COUNTER${counter}`);
				Object.assign(div.style, {
					height : '100%',
					width : '28px',
					position : 'absolute',
					display : 'flex',
					opacity : '0'
				});
				//指示物图标
				const img = document.createElement('img');
				img.src = mainGame.get.counter(counter);
				img.style.height = '100%';

				//指示物数量
				const span = document.createElement('span');

				div.appendChild(img);
				div.appendChild(span);
				this.get.el.counter().appendChild(div);
				return div;
			}
			let v = - 1;
			for (const [counter, ct] of this.counter) {
				const el : HTMLElement = this.get.el.counter().querySelector(`.COUNTER${counter}`)
					?? create_counter(counter);
				const text = ct.toString();
				const span = el.querySelector('span')!;
				if (ct) {
					v ++;
					if (gsap.getProperty(el, 'x') !== v * 28)
						tl.to(el, {
							x : v * 28,
							duration : 0.1
						});
					if (span.innerText !== text)
						if (gsap.getProperty(el, 'opacity'))
							if (gsap.getProperty(span, 'opacity')) {
								tl.to(span, {
									opacity : 0,
									duration : 0.1,
									onComplete : () => (span.innerText = text) as unknown as void
								}, 0.1);
								tl.to(span, {
									opacity : 1,
									duration : 0.1
								}, 0.2);
							} else {
								span.innerText = text;
								tl.to(span, {
									opacity : 1,
									duration : 0.1
								}, 0.1);
							}
						else {
							span.innerText = text;
							tl.to(el, {
								opacity : 1,
								duration : 0.1
							}, 0.1);
						}
				} else if (gsap.getProperty(el, 'opacity')) {
					tl.to(el, {
						x : 0,
						duration : 0.1
					});
					tl.to(el, {
						opacity : 0,
						duration : 0.1,
						onComplete : () => (span.innerText = text) as any as void
					});
				}
			}
			return tl;
		};
		const owner = () : gsap.core.Tween | void => {
			if (this.three.rotation.z !== this.owner * Math.PI)
				return gsap.to(this.three.rotation, {
					z : this.owner * Math.PI,
					duration : 0.2
				});
		};
		const position = () : gsap.core.Timeline | void => {
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
				}, 0.15);
			};
			const img = this.get.el.img();
			const back = mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string;
			const is_back = img.src === back;
			if ((this.pos & POS.FACEDOWN) && !is_back)
				turn(img, back);
			else if ((this.pos & POS.FACEUP) && is_back)
				turn(img, this.pic ?? mainGame.unknown.pic);
			if ((this.pos & POS.ATTACK) && gsap.getProperty(img, 'rotationZ'))
				tl.to(img, {
					rotationZ : 0,
					duration : 0.1,
				}, 0);
			else if ((this.pos & POS.DEFENSE) && !gsap.getProperty(img, 'rotationZ'))
				tl.to(img, {
					rotationZ : - 90,
					duration : 0.1,
				}, 0);
			return tl;
		};
		const location = () : gsap.core.Timeline | void => {
			const axis = Axis.computed.card(this);
			const tl = gsap.timeline();
			if (this.three.position.x === axis.x
				&& this.three.position.y === axis.y
				&& this.three.position.z === axis.z
			) return;
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
		};
		const atk = () : gsap.core.Timeline | void => {
			const atk = this.get.el.atk();
			const text = this.type & TYPE.LINK ? this.atk.toString() : `${this.atk ?? 0}/${this.def ?? 0}`;
			if (atk.innerText === text)
				return;
			if (gsap.getProperty(atk, 'opacity')) {
				const tl = gsap.timeline();
				tl.to(atk, {
					opacity : 0,
					duration : 0.1,
					onComplete : () => atk.innerText = text as unknown as any
				});
				tl.to(atk, {
					opacity : 1,
					duration : 0.1
				}, 0.1);
				return tl;
			} else
				atk.innerText = text;
			return;
		};
		const type = () : gsap.core.Timeline | void => {
			if (!this.need_change.type) return;
			this.need_change.type = false;
			const elements : Array<HTMLDivElement> = [];
			if (this.type & TYPE.LINK) {
				this.get.el.info(KEYS.LINK).querySelector('span')!.innerText = this.link.toString();
				elements.push(this.get.el.info(KEYS.LINK));
			} else if (this.type & TYPE.XYZ) {
				this.get.el.info(KEYS.RANK).querySelector('span')!.innerText = this.rank.toString();
				this.get.el.info(KEYS.OVERLAY).querySelector('span')!.innerText = this.overlay.toString();
				elements.push(this.get.el.info(KEYS.RANK));
				elements.push(this.get.el.info(KEYS.OVERLAY));
			} else if (this.type & TYPE.PENDULUM && this.location & LOCATION.SZONE && [0, 4].includes(this.seq)) {
				this.get.el.info(KEYS.SCALE).querySelector('span')!.innerText = this.scale.toString();
				elements.push(this.get.el.info(KEYS.SCALE));
			} else if (this.type & TYPE.TUNER) {
				this.get.el.info(KEYS.TUNER).querySelector('span')!.innerText = this.level.toString();
				elements.push(this.get.el.info(KEYS.TUNER));
			} else {
				this.get.el.info(KEYS.LEVEL).querySelector('span')!.innerText = this.level.toString();
				elements.push(this.get.el.info(KEYS.TUNER));
			}
			const tl = gsap.timeline();
			Array.from(this.get.el.info().children).forEach((i) => {
				if (elements.includes(i as HTMLDivElement)) {
					if (gsap.getProperty(i, 'opacity'))
						tl.to(i, {
							opacity : 0,
							duration : 0.1
						});
					tl.set(i, {
						x : elements.indexOf(i as HTMLDivElement) * 30,
					}, 0.1);
					tl.to(i, {
						opacity : 1,
						duration : 0.1
					}, 0.1);
				} else {
					tl.to(i, {
						opacity : 0,
						duration : 0.1
					});
					tl.set(i, {
						x : 0,
					}, 0.1);
				}
			});
			return tl;
		};
		if (!(this.pos & POS.FACEDOWN) && (this.location & LOCATION.ONFIELD)) {
			this.get.el.info().style.opacity = '1';
			if (this.location & LOCATION.MZONE)
				this.get.el.atk().style.opacity = '1';
			this.get.el.counter().style.opacity = '1';
		} else {
			this.get.el.info().style.opacity = '0';
			this.get.el.atk().style.opacity = '0';
			this.get.el.counter().style.opacity = '0';
		}
		const run = async () => {
			let resolve = undefined as (() => void) | undefined;
			const promise = new Promise<void>((r) => resolve = r);
			const tl = gsap.timeline();
			tl.add(owner() ?? gsap.timeline());
			tl.add(location() ?? gsap.timeline());
			tl.add(position() ?? gsap.timeline());
			tl.add(atk() ?? gsap.timeline());
			tl.add(type() ?? gsap.timeline());
			tl.add(counter() ?? gsap.timeline());
			tl.then(() => resolve?.());
			return promise;
		}
		if (this.clicked && !(this.location & LOCATION.HAND))
			this.click.img();
		await Promise.all([
			run(),
			activate_btn(),
			activate(),
			status()
		]);
	};

	clear = {
		self : () : void => {
			this.id = 0;
			this.card = undefined;
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
			this.status = 0;
			this.need_change.type = true;
			this.pic = this.pos & POS.FACEDOWN ? mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string
				: mainGame.unknown.pic;
			this.activatable = new Map([
				[COMMAND.ACTIVATE, []],
				[COMMAND.SUMMON, []],
				[COMMAND.SPSUMMON, []],
				[COMMAND.SSET, []],
				[COMMAND.MSET, []],
				[COMMAND.REPOS, []],
				[COMMAND.ATTACK, []]
			]);
		},
		activate : () : Client_Card => {
			this.need_change.activate = true;
			this.activatable.get(COMMAND.ACTIVATE)!.length = 0;
			this.activatable.get(COMMAND.SUMMON)!.length = 0;
			this.activatable.get(COMMAND.SPSUMMON)!.length = 0;
			this.activatable.get(COMMAND.SSET)!.length = 0;
			this.activatable.get(COMMAND.MSET)!.length = 0;
			this.activatable.get(COMMAND.REPOS)!.length = 0;
			this.activatable.get(COMMAND.ATTACK)!.length = 0;
			return this;
		}
	}

	hint = {
		activate : async () : Promise<void> => {
			const style = this.get.el.img().style;
			if (style.filter === 'brightness(1.5)')
				return;
			style.filter = 'brightness(1.5)';
			await mainGame.sleep(600);
			style.filter = 'initial';
		},
		negative : async () : Promise<void> => {
			const style = this.get.el.img().style;
			if (style.filter === 'grayscale(100%)')
				return;
			style.filter = 'grayscale(100%)';
			await mainGame.sleep(600);
			style.filter = 'initial';
		}
	};

	click = {
		img : () : void => {
			if (this.location & LOCATION.HAND) {
				const btn = this.get.el.btn();
				const img = this.get.el.img();
				
				img.style.transform = `translateY(${this.clicked ? 0 : '-50px'})`;
				Object.assign(btn.style, this.clicked ? {
					opacity : '0',
					transform : 'translate(-50%, 0)'
				} : {
					opacity : '1',
					transform : 'translate(-50%, -50px)'
				});
			}
			this.clicked = !this.clicked;
		},
		btn : (target : HTMLElement, cards : Array<Client_Card> = []) : void => {
			if (!this.clicked) return;
			const option = (effect : Array<{ desc ?: number; index : number; }>, command : number) => {
				const array = effect
					.map(i => mainGame.get.desc(i.desc ?? - 1));
				connect.duel.select.option.cancelable = true;
				connect.duel.select.option.title = mainGame.get.strings.system(555);
				connect.duel.select.option.array = array;
				connect.duel.select.option.show = true;
				connect.duel.select.option.confirm = async (i : number) => {
					connect.duel.select.option.show = false;
					connect.response?.(effect[i].index, command);
				}
			};
			for (const j of [
				{ key : KEYS.ACTIVATE, command : COMMAND.ACTIVATE },
				{ key : KEYS.ATTACK, command : COMMAND.ATTACK },
				{ key : KEYS.MSET, command : COMMAND.MSET },
				{ key : KEYS.SSET, command : COMMAND.SSET },
				{ key : KEYS.POS_ATTACK, command : COMMAND.REPOS },
				{ key : KEYS.POS_DEFENCE, command : COMMAND.REPOS },
				{ key : KEYS.FLIP, command : COMMAND.REPOS },
				{ key : KEYS.SUMMON, command : COMMAND.SUMMON },
				{ key : KEYS.PSUMMON, command : COMMAND.SPSUMMON },
				{ key : KEYS.PSUMMON, command : COMMAND.SPSUMMON },
				{ key : KEYS.SCALE, command : COMMAND.ACTIVATE }
			])
				if (target.classList.contains(j.key)) {
					const c = cards
						.filter(i => i.get.activate(j.key).length > 0);
					if (c.length) {
						connect.duel.select.cards.cancelable = true;
						connect.duel.select.cards.min = 1;
						connect.duel.select.cards.max = 1;
						connect.duel.select.cards.cards = c;
						connect.duel.select.cards.confirm = async (i : Client_Card) => {
							connect.duel.select.cards.show = false;
							i.get.activate(j.key).length ? option(i.get.activate(j.key), j.command)
								: await connect.response?.(i.get.activate(j.key)[0].index, j.command);
						};
						connect.duel.select.cards.show = true;
					} else if (this.get.activate(j.key).length > 0)
						option(this.get.activate(j.key), j.command);
					else
						connect.response?.(this.get.activate(j.key)[0], j.command);
				}
		}
	};

	contains = (target : HTMLElement) : boolean => this.three.element.contains(target);
};

export default Client_Card;