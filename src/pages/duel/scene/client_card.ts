import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';
import lodash from 'lodash';

import Card, { TYPE } from '@/script/card';
import { KEYS } from '@/script/constant';
import mainGame from '@/script/game';

import { COMMAND, LOCATION, POS, STATUS } from '@/pages/duel/ygo-protocol/network';

import * as SIZE from './scene-size';
import Axis from './axis';
import { duel } from './scene';

class Client_Card {
	three : CSS.CSS3DObject;
	location : number;
	owner : number;
	seq : number;
	pos : number;
	id : number;
	alias : number;
	card ?: Card;
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
	overlays : Array<Client_Card>;
	status : number;
	equip ?: Client_Card;
	activatable : Map<number, Array<{ desc ?: number; index : number; }>>;
	desc : Map<number, number>;
	hint_msg : string;
	need_change = {
		type : false,
		activate : false,
		counter : false,
		status : false,
		z : false,
		pos : false,
		loc : false,
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
		this.overlays = [];
		this.status = 0;
		this.pos = POS.FACEDOWN_ATTACK;
		this.three = this.init.on();
		this.activatable = new Map([
			[COMMAND.ACTIVATE, []],
			[COMMAND.SUMMON, []],
			[COMMAND.SPSUMMON, []],
			[COMMAND.SSET, []],
			[COMMAND.MSET, []],
			[COMMAND.REPOS, []],
			[COMMAND.ATTACK, []]
		]);
		this.desc = new Map();
		this.hint_msg = '';
		this.counter = new Map();
		this.clicked = false;
	};

	init = {
		on : () : CSS.CSS3DObject => {
			const dom = document.createElement('div');
			Object.assign(dom.style, {
				position : 'relative',
				opacity : '0',
				fontFamily : 'ATK',
				color : 'white',
				transition : 'opacity 0.2s ease'
			});
			dom.appendChild(this.init.border());
			dom.appendChild(this.init.img(mainGame.back.pic));
			dom.appendChild(this.init.atk());
			dom.appendChild(this.init.info());
			dom.appendChild(this.init.counter());
			dom.appendChild(this.init.equip());
			setTimeout(() => dom.style.opacity = '1', 0);
			return new CSS.CSS3DObject(dom);
		},
		border : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				position : 'absolute',
				opacity : '0',
				left : `${- SIZE.WIDTH / 2}px`,
				top : `${- SIZE.HEIGHT / 2}px`,
				width : `${SIZE.WIDTH}px`,
				height : `${SIZE.HEIGHT}px`,
				transition : 'all 0.2s ease',
				boxShadow: '0 0 10px 5px yellow',
				pointerEvents : 'none'
			});
			return child;
		},
		img : (src : string) : HTMLImageElement => {
			const child = document.createElement('img');
			child.src = src;
			Object.assign(child.style, {
				position : 'absolute',
				left : `${- SIZE.WIDTH / 2}px`,
				top : `${- SIZE.HEIGHT / 2}px`,
				width : `${SIZE.WIDTH}px`,
				height : `${SIZE.HEIGHT}px`,
				transition : 'all 0.2s ease',
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
				left : `-${SIZE.HEIGHT / 2}px`,
				top : `${SIZE.HEIGHT / 2 - 16}px`,
				width : `${SIZE.HEIGHT}px`,
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				display : 'flex',
				justifyContent : 'center',
				transition : 'all 0.2s ease',
				userSelect : 'none',
				pointerEvents : 'none'
			});
			return child;
		},
		info : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '1',
				position : 'absolute',
				left : `-${SIZE.HEIGHT / 2}px`,
				top : `${SIZE.HEIGHT / 2 - 56}px`,
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
				left : `-${SIZE.HEIGHT / 2}px`,
				top : `${SIZE.HEIGHT / 2 - 36}px`,
				height : '16px',
				width : `${SIZE.HEIGHT}px`,
				color : 'white',
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				alignItems: 'center',
				transition : 'all 0.2s ease',
				userSelect : 'none',
				pointerEvents : 'none'
			});
			return child;
		},
		equip : () : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				position : 'absolute',
				opacity : '0',
				left : `-${SIZE.HEIGHT / 2}px`,
				top : `${- SIZE.HEIGHT / 2}px`,
				width : `${SIZE.HEIGHT}px`,
				height : `${SIZE.HEIGHT}px`,
				transition : 'all 0.2s ease',
				boxShadow: '0 0 5px 2px blue',
				userSelect : 'none',
				pointerEvents : 'none'
			});
			return child;
		}
	};

	get = {
		el : {
			border : () : HTMLDivElement => this.three.element.children[0] as HTMLDivElement,
			img : () : HTMLImageElement => this.three.element.children[1] as HTMLImageElement,
			atk : () : HTMLDivElement => this.three.element.children[2] as HTMLDivElement,
			info : (query ?: string) : HTMLDivElement => query ? this.get.el.info().querySelector('.' + query) as HTMLDivElement
				: this.three.element.children[3] as HTMLDivElement,
			counter : () : HTMLDivElement => this.three.element.children[4] as HTMLDivElement,
			equip : () : HTMLDivElement => this.three.element.children[5] as HTMLDivElement
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
			if (!this.need_change.z)
				this.need_change.z = this.owner !== owner;
			this.owner = owner;
			return this;
		},
		pos : (pos : number) : Client_Card => {
			if (!pos) pos = POS.FACEDOWN_ATTACK;
			if (pos & POS.ATTACK & POS.DEFENSE) pos &= ~ POS.DEFENSE;
			if (!this.need_change.pos)
				this.need_change.pos = this.pos !== pos;
			this.pos = pos;
			return this;
		},
		location : (location : number) : Client_Card => {
			if (!this.need_change.loc)
				this.need_change.loc = this.location !== location;
			this.location = location;
			return this;
		},
		seq : (seq : number) : Client_Card => {
			if (!this.need_change.loc)
				this.need_change.loc = this.seq !== seq;
			this.seq = seq;
			return this;
		},
		id : (id : number) : Client_Card => {
			if (!id)
				this.clear.self();
			this.id = id;
			return this;
		},
		alias : (alias : number) : Client_Card => {
			this.alias = alias;
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
			this.overlay = overlay;
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
		activate : (flag : number, index : number, desc ?: number, chk : boolean = false) : Client_Card => {
			this.need_change.activate = chk;
			this.activatable
				.get(flag)?.push({ index : index, desc : desc});
			return this;
		},
		status : (status : number) : Client_Card => {
			if (!this.need_change.status)
				this.need_change.status = this.status !== status;
			this.status = status;
			return this;
		},
		equip : (c : Client_Card) : Client_Card => {
			this.equip = c;
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
						}, 0);
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
					}, 0);
					tl.to(el, {
						opacity : 0,
						duration : 0.1,
						onComplete : () => (span.innerText = text) as any as void
					}, 0);
				}
			}
			return tl;
		};
		const owner = () : gsap.core.Tween | void => {
			if (!this.need_change.z) return;
			this.need_change.z = false;
			return gsap.to(this.three.rotation, {
				z : this.owner * Math.PI,
				duration : 0.2
			});
		};
		const position = () : gsap.core.Timeline | void => {
			if (!this.need_change.pos) return;
			this.need_change.pos = false;
			const tl = gsap.timeline();
			const turn = (el : HTMLImageElement, pic : string) => {
				tl.set(el, {
					rotationY : 0
				}, 0);
				tl.to(el, {
					rotationY : 90,
					duration : 0.1,
					onComplete : () => (el.src = pic ?? '') as unknown as void
				}, 0);
				tl.set(el, {
					rotationY : -90
				}, 0.2);
				tl.to(el, {
					rotationY : 0,
					duration : 0.1
				}, 0.25);
			};
			const img = this.get.el.img();
			const back = mainGame.back.pic;
			const is_back = img.src === back;
			const pic = mainGame.get.card(this.id).pic;
			if (this.id && img.src !== pic && (this.pos & POS.FACEUP) && !is_back)
				img.src = pic;
			else if ((this.pos & POS.FACEDOWN) && !is_back)
				turn(img, back);
			else if ((this.pos & POS.FACEUP) && is_back)
				turn(img, pic);
			const z = parseInt(gsap.getProperty(img, 'rotationZ').toString());
			if (this.location & LOCATION.MZONE) {
				if ((this.pos & POS.ATTACK) && z)
					tl.to(img, {
						rotationZ : 0,
						duration : 0.1,
					}, 0)
				else if ((this.pos & POS.DEFENSE) && !z)
					tl.to(img, {
						rotationZ : - 90,
						duration : 0.1,
					}, 0);
			} else if (z)
				tl.to(img, {
					rotationZ : 0,
					duration : 0.1,
				}, 0);
			return tl;
		};
		const location = () : gsap.core.Timeline | void => {
			if (!this.need_change.loc) return;
			this.need_change.loc = false;
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
				}, 0);
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
				}, 0);
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
					duration : 0.05,
					onComplete : () => atk.innerText = text as unknown as any
				}, 0);
				tl.to(atk, {
					opacity : 1,
					duration : 0.05
				}, 0.05);
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
				elements.push(this.get.el.info(KEYS.LEVEL));
			}
			const tl = gsap.timeline();
			Array.from(this.get.el.info().children).forEach((i) => {
				if (elements.includes(i as HTMLDivElement)) {
					if (gsap.getProperty(i, 'opacity'))
						tl.to(i, {
							opacity : 0,
							duration : 0.05
						}, 0);
					tl.set(i, {
						x : elements.indexOf(i as HTMLDivElement) * 30,
					}, 0.05);
					tl.to(i, {
						opacity : 1,
						duration : 0.05
					}, 0.05);
				} else {
					tl.to(i, {
						opacity : 0,
						duration : 0.05
					});
					tl.set(i, {
						x : 0,
					}, 0.05);
				}
			});
			return tl;
		};
		if (!(this.pos & POS.FACEDOWN) && (this.location & LOCATION.ONFIELD)) {
			if (this.location === LOCATION.MZONE)
				this.get.el.atk().style.opacity = '1';
			if (this.location === LOCATION.MZONE
				|| ((this.location & (LOCATION.SZONE | LOCATION.PZONE))
					&& (this.type & TYPE.PENDULUM))
			)
				this.get.el.info().style.opacity = '1';
			this.get.el.counter().style.opacity = '1';
		} else {
			this.get.el.info().style.opacity = '0';
			this.get.el.atk().style.opacity = '0';
			this.get.el.counter().style.opacity = '0';
		}
		const run = async () => {
			const tls = [
				owner(),
				location(),
				position(),
				atk(),
				type(),
				counter()
			]
				.filter(i => i !== undefined);
			if (tls.length) {
				let resolve = undefined as (() => void) | undefined;
				const promise = new Promise<void>((r) => resolve = r);
				const tl = gsap.timeline();
				tls.forEach(i => tl.add(i));
				tl.then(() => resolve?.());
				await promise;
			}
		};
		if (this.clicked && !(this.location & LOCATION.HAND))
			this.click.img();
		await Promise.all([
			run(),
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
			if ((this.location & LOCATION.HAND) && this.owner)
				this.set.pos(POS.FACEDOWN_ATTACK);
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
			this.activatable.set(COMMAND.ACTIVATE, [])
			this.activatable.set(COMMAND.SUMMON, []);
			this.activatable.set(COMMAND.SPSUMMON, []);
			this.activatable.set(COMMAND.SSET, []);
			this.activatable.set(COMMAND.MSET, []);
			this.activatable.set(COMMAND.REPOS, []);
			this.activatable.set(COMMAND.ATTACK, []);
			return this;
		},
		counter : () : Client_Card => {
			this.need_change.counter = true;
			this.counter.clear();
			return this;
		},
		equip : () : Client_Card => {
			this.equip = undefined;
			return this;
		},
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
		},
		selected : async () : Promise<void> => {
			const tl = gsap.timeline();
			if ((this.location & LOCATION.OVERLAY)
				|| !(this.location & (LOCATION.ONFIELD | LOCATION.HAND))
			) {
				const div = this.get.el.img();
				tl.to(div, {
					x : `+= ${SIZE.WIDTH * 1.2}px`,
					duration : 0.1
				}, 0);
				tl.to(div, {
					x : `-= ${SIZE.WIDTH * 1.2}px`,
					duration : 0.1
				}, 0.6);
			} else {
				const div = this.get.el.border();
				tl.to(div, {
					opacity : 1,
					duration : 0.1
				}, 0);
				tl.to(div, {
					scale : 1.2,
					duration : 0.2
				}, 0.1);
				tl.to(div, {
					opacity : 0,
					duration : 0.2
				}, 0.3);
				tl.set(div, {
					scale : 1
				}, 0.5);
			}
			let resolve = undefined as (() => void) | undefined;
			const promise = new Promise<void>((r) => resolve = r);
			tl.then(() => resolve?.());
			await promise;
		},
		equip : (show ?: boolean) : void => {
			if (this.location & LOCATION.ONFIELD) {
				const i = this.get.el.equip();
				i.style.opacity = (show ? 1 : 0).toString();
			}
		}
	};

	click = {
		img : () : void => {
			if (this.location & LOCATION.HAND) {
				const z = Axis.computed.card(this).z ?? 0;
				const img = this.get.el.img();
				img.style.transform = `translateY(${this.clicked ? 0 : '-50px'})`;
				this.three.position.z = z + (this.clicked ? 0 : SIZE.GAP.HAND * 2);
			}
			this.clicked = !this.clicked;
		}
	};

	contains = (target : HTMLElement) : boolean => this.three.element.contains(target);
};

export default Client_Card;