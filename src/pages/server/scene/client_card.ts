import Card, { TYPE } from '@/script/card';
import mainGame from '@/script/game';
import * as CONSTANT from '@/script/constant';
import { COMMAND, EDESC, LOCATION, POS } from '@/pages/server/post/network';
import gsap from './gsap';

import * as CSS from 'three/examples/jsm/renderers/CSS3DRenderer.js';

interface Hover {
	on : Function;
	end : Function;
	click : Function;
	response : Function;
};

interface Client_Card_Div {
	img : HTMLImageElement;
	atk : HTMLDivElement;
	info : HTMLDivElement;
	counter : HTMLDivElement;
	btn : HTMLDivElement;
};

class Client_Card {
	three : CSS.CSS3DObject;
	code : number;
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
	pos : number;
	loc : number;
	is_pendulum : boolean;
	show_info : boolean;
	div : Client_Card_Div;

	constructor (src : string, size : {
		width : number; height : number;
	}, hover : Hover) {
		this.code = 0;
		this.alias = 0;
		this.card = undefined;
		this.pic = undefined;
		this.code = 0;
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
		this.overlay = -1;
		this.pos = POS.NONE;
		this.loc = LOCATION.NONE;
		this.is_pendulum = false;
		this.show_info = false;
		[this.three, this.div] = this.init.on(src, size, hover);
	};

	init = {
		on : (src : string, size : { width : number; height : number; }, hover : Hover) : [CSS.CSS3DObject, Client_Card_Div] => {
			const dom = document.createElement('div');
			dom.style.opacity = '0';
			const div = {
				img : this.init.img(src, size, hover),
				atk : this.init.atk(size),
				info : this.init.info(size),
				counter : this.init.counter(size),
				btn : this.init.btn(hover)
			};
			for (const [_, i] of Object.entries(div))
				dom.appendChild(i);
			return [new CSS.CSS3DObject(dom), div];
		},
		img : (src : string, size : { width : number; height : number; }, hover : Hover) : HTMLImageElement => {
			const child = document.createElement('img');
			child.src = src;
			Object.assign(child.style, {
				width : `${size.width}px`,
				height : `${size.height}px`,
				transition : 'all 0.2s ease'
			});
			child.addEventListener('mouseenter', hover.on.bind(null, this));
			child.addEventListener('mouseout', hover.end.bind(null, this));
			return child;
		},
		atk : (size : { width : number; height : number; }) : HTMLDivElement => {
			const child = document.createElement('div');
			child.innerText = '';
			Object.assign(child.style, {
				backgroundColor : 'rgba(0, 0, 0, 0.3)',
				opacity : '0',
				position : 'absolute',
				bottom : '0',
				left : `-${(size.height - size.width) / 2}px`,
				width : `${size.height}px`,
				color : 'white',
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				fontFamily : 'AtkDef',
				display : 'flex',
				justifyContent : 'center',
				transition : 'all 0.2s ease',
				userSelect: 'none'
			});
			return child;
		},
		info : (size : { width : number; height : number; }) : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '1',
				position : 'absolute',
				bottom : '40px',
				left : '-10px',
				height : '16px',
				width : `${size.height}px`,
				color : 'white',
				textShadow : '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',
				fontSize : '20px',
				fontFamily : 'AtkDef',
				transition : 'all 0.2s ease',
				userSelect: 'none'
			});
			for (const i of [
				CONSTANT.KEYS.LINK,
				CONSTANT.KEYS.RANK,
				CONSTANT.KEYS.OVERLAY,
				CONSTANT.KEYS.SCALE,
				CONSTANT.KEYS.TUNER,
				CONSTANT.KEYS.LEVEL
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
				img.src = mainGame.get.textures(CONSTANT.KEYS.INFO, i) as string;
				img.style.height = '100%';
				div.appendChild(img);
				const span = document.createElement('span');
				span.style.transition = 'all 0.1s ease';
				span.innerText = '';
				if (i === CONSTANT.KEYS.TUNER)
					span.style.color = 'lightgreen';
				div.appendChild(span);
				child.appendChild(div);
			}
			return child;
		},
		counter : (size : { width : number; height : number; }) : HTMLDivElement => {
			const child = document.createElement('div');
			Object.assign(child.style, {
				opacity : '1',
				position : 'absolute',
				bottom : '20px',
				left : '-10px',
				height : '16px',
				width : `${size.height}px`,
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
		btn : (hover : Hover) => {
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
				['activate', CONSTANT.FILES.TEXTURE_BTN_ACTIVATE],
				['attack', CONSTANT.FILES.TEXTURE_BTN_ATTACK],
				['mset', CONSTANT.FILES.TEXTURE_BTN_MSET],
				['sset', CONSTANT.FILES.TEXTURE_BTN_SSET],
				['pos_attack', CONSTANT.FILES.TEXTURE_BTN_POS_ATTACK],
				['pos_defence', CONSTANT.FILES.TEXTURE_BTN_POS_DEFENCE],
				['filp', CONSTANT.FILES.TEXTURE_BTN_FILP],
				['summon', CONSTANT.FILES.TEXTURE_BTN_SUMMON],
				['psummon', CONSTANT.FILES.TEXTURE_BTN_PSUMMON],
				['spsummon', CONSTANT.FILES.TEXTURE_BTN_SPSUMMON],
				['scale', CONSTANT.FILES.TEXTURE_BTN_SCALE],
			]) {
				const [key, src] = i as [string, Array<string>];
				const img = document.createElement('img');
				img.classList.add(key);
				img.classList.add('btn');
				Object.assign(img.style, {
					height : '100%',
					display : 'none'
				});
				const srcs = mainGame.get.textures(src) as Array<string> | undefined ?? ['', ''];
				img.src = srcs[0];
				img.addEventListener('mouseenter', () => {
					img.src = srcs[1];
				});
				img.addEventListener('mouseout', () => {
					img.src = srcs[0];
				});
				img.addEventListener('click', async () => {
					await hover.response(this, ['pos_attack', 'pos_defence', 'filp'].includes(key) ? 'repos' : key);
				});
				child.appendChild(img);
			}
			return child;
		}
	};

	update = {
		code : async (code : number) : Promise<void> => {
			if (code === 0) {
				this.clear();
				return;
			}
			if (code === this.code)
				return;
			const card : Card = mainGame.get.card(code);
			if (card.pic === '')
				await mainGame.load.pic([code]);
			this.card = card;
			this.code = code;
			this.alias = card.alias;
			this.pic = card.pic;
			if ((this.pos & POS.FACEUP) > 0)
				this.div.img.src = this.pic;
			this.type = card.type;
			this.level = (card.is_xyz() || card.is_link()) ? 0 : card.level;
			this.rank = card.is_xyz() ? card.level : 0;
			this.link = card.is_link() ? card.level : 0;
			this.attribute = card.attribute;
			this.atk = card.atk;
			this.def = card.def;
			this.scale = card.scale;
		},
		alias : (code : number) : void => {
			this.alias = code;
		},
		type : (type : number) : void => {
			if (this.type === type) return;
			this.type = type;
			this.change.type();
			this.change.atk();
		},
		level : (level : number) : void => {
			if (this.level === level) return;
			this.level = level & 0xffff;
			this.change.type();
		},
		rank : (rank : number) : void => {
			if (this.rank === rank) return;
			this.rank = rank;
			this.change.type();
		},
		attribute : (attribute : number) : void => {
			this.attribute = attribute;
		},
		race : (race : number) : void => {
			this.race = race;
		},
		link : (link : number) : void => {
			if (this.link === link) return;
			this.link = link;
			this.change.type();
		},
		atk : (atk : number) : void => {
			if (this.atk === atk) return;
			this.atk = atk;
			this.change.atk();
		},
		def : (def : number) : void => {
			if (this.def === def) return;
			this.def = def;
			this.change.atk();
		},
		scale : (scale : number) : void => {
			if (this.scale === scale) return;
			this.scale = scale;
			this.change.type();
		},
		pos : (pos : number) : void => {
			if (this.pos === pos) return;
			this.pos = pos;
		},
		loc : (loc : number) : void => {
			if (this.loc === loc) return;
			this.loc = loc;
		}
	};
	clear = () : void => {
		this.card = undefined;
		this.pic = undefined;
		this.code = 0;
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
		this.activatable.clear();
		this.show.info.off();
	};
	is_xyz = () : boolean => {
		return this.rank !== undefined && this.rank > 0;
	};
	is_link = () : boolean => {
		return this.link !== undefined && this.link > 0;
	};
	is_tuner = () : boolean => {
		return this.type !== undefined && ((this.type & TYPE.TUNER) === TYPE.TUNER);
	}
	add = {
		counter : async (counter : number, ct : number) : Promise<void> => {
			//查找是否已有div
			const el : HTMLElement | null = this.div.counter.querySelector(`.counter-${counter.toString(16)}`);
			//如果存在则变化数量
			const sort = () : void => {
				let v = 0;
				(Array.from(this.div.counter.children) as Array<HTMLElement>).forEach(i => {
					const span : HTMLSpanElement = i.querySelector('span')!;
					const count : number = Math.max(0, ct + Number(span.innerText));
					if (isNaN(count) || !!count) {
						i.style.transform = `translateX(${v * 28}px)`;
						v ++;
					}
				});
			}
			if (el) {
				const span : HTMLSpanElement = el.querySelector('span')!;
				//数量最少为0
				let count : number = Math.max(0, ct + Number(span.innerText));
				if (isNaN(count))
					count = 0;
				span.style.opacity = '0';
				await mainGame.sleep(150);
				span.innerText = count.toString();
				span.style.opacity = '1';
				if (el.style.opacity === '1' && !count) {
					await mainGame.sleep(250);
					el.style.opacity = '0';
				} else if (el.style.opacity === '0' && !!count) {
					el.style.opacity = '1';
				}
				sort();
			//如果不存在则增加
			} else {
				if (ct <= 0)
					return;
				const div = document.createElement('div');
				//为指示物div设置class，class为指示物编号
				div.classList.add(`counter-${counter.toString(16)}`);
				Object.assign(div.style, {
					height : '100%',
					width : '28px',
					position : 'absolute',
					display : 'flex',
					opacity : '0',
					transition : 'all 0.2s ease'
				});
				//指示物图标
				const img = document.createElement('img');
				img.src = mainGame.get.counter(counter);
				img.style.height = '100%';

				//指示物数量
				const span = document.createElement('span');
				span.style.transition = 'all 0.1s ease';
				span.innerText = ct.toString();

				div.appendChild(img);
				div.appendChild(span);
				this.div.counter.appendChild(div);
				sort();
				await mainGame.sleep(100);
				div.style.opacity = '1';
			}
		}
	};

	show = {
		info : {
			on : async (ct : number = -1, is_pendulum : boolean = false) : Promise<void> => {
				this.show_info = true;
				this.is_pendulum = is_pendulum;
				(Array.from(this.div.info.children) as Array<HTMLDivElement>).forEach((i : HTMLDivElement) => {
					i.style.opacity = '0';
				});
				await mainGame.sleep(200);
				const elements : Array<HTMLDivElement> = [];
				if (is_pendulum) {
					const el : HTMLDivElement = this.div.info.querySelector('.scale')!;
					el.querySelector('span')!.innerText = this.scale.toString();
					elements.push(el);
				} else if (this.is_link()) {
					const el : HTMLDivElement = this.div.info.querySelector('.link')!;
					el.querySelector('span')!.innerText = this.link.toString();
					elements.push(el);
				} else if (this.is_xyz()) {
					const el1 : HTMLDivElement = this.div.info.querySelector('.rank')!;
					el1.querySelector('span')!.innerText = this.rank.toString();
					elements.push(el1);
					const el2 : HTMLDivElement = this.div.info.querySelector('.overlay')!;
					if (ct > -1)
						this.overlay = ct;
					el2.querySelector('span')!.innerText = `${this.overlay > -1 ? this.overlay : ''}`;
					elements.push(el2);
				} else if (this.is_tuner()) {
					const el : HTMLDivElement = this.div.info.querySelector('.tuner')!;
					el.querySelector('span')!.innerText = this.level.toString();
					elements.push(el);
				} else {
					const el : HTMLDivElement = this.div.info.querySelector('.level')!;
					el.querySelector('span')!.innerText = this.level.toString();
					elements.push(el);
				}
				elements.forEach((i, v) => {
					i.style.transform = `translateX(${v * 28}px)`;
					setTimeout(() => i.style.opacity = '1', 200);
				});
			},
			off : () : void => {
				this.overlay = -1;
				this.show_info = false;
				this.is_pendulum = false;
				(Array.from(this.div.info.children) as Array<HTMLDivElement>).forEach((i : HTMLDivElement) => {
					if (i.style.opacity === '1') {
						i.style.opacity = '0';
						i.style.transform = 'initial';
					}
				});
			}
		},
		atk : {
			on : () : void => {
				this.div.atk.innerText = this.is_link() ? this.atk.toString() : `${this.atk ?? 0}/${this.def ?? 0}`;
				this.div.atk.style.opacity = '1';
			},
			off : () : void => {
				this.div.atk.style.opacity = '0';
			}
		},
		btn : {
			on : () : void => {
				this.div.btn.style.display = 'flex';
				setTimeout(() => {
					Object.assign(this.div.btn.style, {
						opacity : '1',
						top : '-50px'
					});
				}, 50);
			},
			off : () : void => {
				Object.assign(this.div.btn.style, {
					opacity : '0',
					top : '0px'
				});
				setTimeout(() => {
					this.div.btn.style.display = 'none';
				}, 200);
			},
			chk : () : boolean => {
				return this.div.btn.style.display === 'flex';
			}
		},
		activate : () : void => {
			const style = this.div.img.style;
			style.filter = 'brightness(1.5)';
			setTimeout(() => {
				style.filter = 'initial';
			}, 600);
		},
		counter : {
			off : () : void => {
				Array.from(this.div.counter.children).forEach(el => {
					(el as HTMLElement).style.opacity = '0';
					setTimeout(() => {
						const span : HTMLSpanElement = el.querySelector('span')!;
						span.innerText = '0';
					}, 100);
				});
			}
		}
	};

	change = {
		xyz : async (ct : number = -1) : Promise<void> => {
			if (ct > -1)
				this.overlay = ct;
			const el : HTMLElement = this.div.info.querySelector('.overlay')!;
			if (el.style.opacity === '1') {
				const span = el.querySelector('span')!;
				span.style.opacity = '0';
				await mainGame.sleep(150);
				span.querySelector('span')!.innerText = `${this.overlay > -1 ? this.overlay : ''}`;
				span.style.opacity = '1';
			}
		},
		atk : async () : Promise<void>=> {
			const el = this.div.atk;
			const text = this.is_link() ? this.atk.toString() : `${this.atk ?? 0}/${this.def ?? 0}`;
			if (el.innerText === text)
				return;
			if (el.style.opacity === '1') {
				el.style.opacity = '0';
				await mainGame.sleep(200);
				el.innerText = text;
				el.style.opacity = '1';
			} else
				el.innerText = text;
		},
		type : async () : Promise<void>=> {
			const info = this.div.info;
			if (this.show_info) {
				(Array.from(info.children) as Array<HTMLDivElement>).forEach((i : HTMLDivElement) => {
					i.style.opacity = '0';
				});
				await mainGame.sleep(200);
				const elements : Array<HTMLDivElement> = [];
				if (this.is_pendulum) {
					const el : HTMLDivElement = this.div.info.querySelector('.scale')!;
					el.querySelector('span')!.innerText = this.scale.toString();
					elements.push(el);
				} else if (this.is_link()) {
					const el : HTMLDivElement = info.querySelector('.link')!;
					el.querySelector('span')!.innerText = this.link.toString();
					elements.push(el);
				} else if (this.is_xyz()) {
					const el1 : HTMLDivElement = info.querySelector('.rank')!;
					el1.querySelector('span')!.innerText = this.rank.toString();
					elements.push(el1);
					const el2 : HTMLDivElement = info.querySelector('.overlay')!;
					el2.querySelector('span')!.innerText = `${this.overlay > -1 ? this.overlay : ''}`;
					elements.push(el2);
				} else if (this.is_tuner()) {
					const el : HTMLDivElement = info.querySelector('.tuner')!;
					el.querySelector('span')!.innerText = this.level.toString();
					elements.push(el);
				} else {
					const el : HTMLDivElement = info.querySelector('.level')!;
					el.querySelector('span')!.innerText = this.level.toString();
					elements.push(el);
				}
				elements.forEach((i, v) => {
					i.style.transform = `translateX(${v * 28}px)`;
					setTimeout(() => i.style.opacity = '1', 200);
				});
			} else
				if ((this.type & TYPE.PENDULUM) > 0 && (this.loc & LOCATION.SZONE) > 0)
					this.show.info.on(0, true);
		}
	};

	select = {
		on : () => {
			const style = this.div.img.style;
			style.boxShadow = '0 0 8px yellow';
		},
		off : () => {
			const style = this.div.img.style;
			style.boxShadow = 'initial';
		}
	};

	activatable = {
		desc : [] as Array<{desc : number; flag : number;}>,
		flag : 0,
		on : (i : number | {desc : number; flag : number;}, show_btn : boolean = true) => {
			typeof i === 'number' ? this.activatable.flag |= i : (() => {
				if (i.flag === EDESC.NONE) {
					const flags = new Map([
						[1160, COMMAND.SCALE]
					]);
					this.activatable.flag |= flags.get(i.desc) ?? COMMAND.ACTIVATE;
				}
			})();
			const style = this.div.img.style;
			style.boxShadow = (this.activatable.flag & (COMMAND.ACTIVATE + COMMAND.SPSUMMON + COMMAND.PSUMMON + COMMAND.SCALE)) > 0 ?
				'0 0 8px yellow' : this.activatable.flag > 0 ? '0 0 8px rgba(119, 166, 255, 1)' : 'initial';
			if (show_btn) {
				const map = new Map([
					[COMMAND.ACTIVATE, 'activate'],
					[COMMAND.ATTACK, 'attack'],
					[COMMAND.MSET, 'mset'],
					[COMMAND.SSET, 'sset'],
					[COMMAND.REPOS, 'repos'],
					[COMMAND.SUMMON, 'summon'],
					[COMMAND.PSUMMON, 'psummon'],
					[COMMAND.SPSUMMON, 'spsummon'],
					[COMMAND.SCALE, 'scale']
				]) as Map<number, string>;
				for (const [_, i] of Object.entries(COMMAND)) {
					if (!map.has(i))
						continue;
					const btn = this.div.btn.querySelector(`.${i === COMMAND.REPOS ? (() => {
						if ((this.pos & POS.FACEDOWN) > 0)
							return 'filp';
						if ((this.pos & POS.ATTACK) > 0)
							return 'pos_defence';
						if ((this.pos & POS.DEFENSE) > 0)
							return 'pos_attack';
					})() : map.get(i)!}`)! as HTMLElement;
					btn.style.display = (this.activatable.flag & i) === i ? 'initial' : 'none';
				}
			}
		},
		clear : () => {
			this.activatable.flag = 0;
			const style = this.div.img.style;
			style.boxShadow = 'initial';
			(Array.from(this.div.btn.children) as Array<HTMLElement>).forEach(btn => {
				btn.style.display = 'none';
			});
		},
	};
}

export default Client_Card;