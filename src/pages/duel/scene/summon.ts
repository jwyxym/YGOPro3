import type { Application } from 'pixi.js';
import type { Spine } from '@esotericsoftware/spine-pixi-v8';
import mainGame from '@/script/game';
import { Spine as Spine_Resource } from '@/script/invoke';

class Summon {
	host ?: HTMLDivElement;
	app ?: Application;
	monster ?: Spine;
	generation : number = 0;
	finish ?: (() => void);
	resize ?: ResizeObserver;

	mount = (parent : HTMLElement) : void => {
		if (__SPINE__) {
			this.destroy();
			const host : HTMLDivElement = document.createElement('div');
			host.className = 'ygopro3__summon-spine';
			host.setAttribute('aria-hidden', 'true');
			Object.assign(host.style, {
				position: 'absolute', inset: '0', pointerEvents: 'none',
				zIndex: '5', overflow: 'hidden',
			});
			parent.appendChild(host);
			this.host = host;
		}
	};

	play = async (code : number) : Promise<void> => {
		if (!this.host || !code) return;
		this.finish?.();
		const generation : number = ++ this.generation;
		let timer : ReturnType<typeof setTimeout> | undefined;
		let settle : () => void = () : void => {};
		const done : Promise<void> = new Promise<void>((resolve : () => void) : void => {
			settle = resolve;
		});
		const finish : () => void = () : void => {
			if (timer !== undefined) clearTimeout(timer);
			if (this.finish === finish) {
				this.generation ++;
				this.resize?.disconnect();
				this.resize = undefined;
				this.monster?.destroy();
				this.monster = undefined;
				this.app?.stop();
				if (this.app) this.app.canvas.style.visibility = 'hidden';
				this.finish = undefined;
			}
			settle();
		};
		this.finish = finish;
		timer = setTimeout(finish, 12000);
		this.render(code, generation, finish).catch((error : unknown) : void => {
			console.error('Failed to load Spine summon:', error);
			finish();
		});
		await done;
	};

	render = async (code : number, generation : number, finish : () => void) : Promise<void> => {
		const current : () => boolean = () : boolean => generation === this.generation && this.host !== undefined;
		const resource : Spine_Resource | undefined = await mainGame.get.spine(code);
		if (!current() || !resource) { finish(); return; }
		const pixi = await import('pixi.js');
		const runtime = await import('@esotericsoftware/spine-pixi-v8');
		if (!current()) return;
		if (!this.app) {
			const app : Application = new pixi.Application();
			try {
				await app.init({ width: this.host!.clientWidth, height: this.host!.clientHeight,
					backgroundAlpha: 0, antialias: true, autoDensity: true,
					resolution: Math.min(window.devicePixelRatio || 1, 2), preference: 'webgl' });
			} catch (e) {
				console.error(e)
			}
			if (!current()) { app.destroy(true); return; }
			app.canvas.style.pointerEvents = 'none';
			this.host!.appendChild(app.canvas);
			this.app = app;
		}

		const skeleton : string = resource.skeleton;
		const atlas : string = resource.atlas;
		await pixi.Assets.load([
			{ src : resource.skeleton },
			{ src : resource.atlas, data : { images : resource.img ?? {} } },
		]);
		if (!current()) return;
		const monster : Spine = runtime.Spine.from({ skeleton, atlas });
		this.monster = monster;
		this.app.stage.addChild(monster);
		const animation : string | undefined = resource.animation ?? monster.skeleton.data.animations[0]?.name;
		if (!animation || !monster.skeleton.data.findAnimation(animation)) { finish(); return; }
		const data : Spine['skeleton']['data'] = monster.skeleton.data;
		const layout : () => void = () : void => {
			if (!this.host || !this.app) return;
			const width : number = Math.max(this.host.clientWidth, 1);
			const height : number = Math.max(this.host.clientHeight, 1);
			this.app.renderer.resize(width, height);
			const scale : number = Math.min(width * 0.75 / Math.max(data.width, 1), height * 0.8 / Math.max(data.height, 1));
			monster.scale.set(scale);
			monster.position.set(width / 2 - (data.x + data.width / 2) * scale,
				height / 2 + (data.y + data.height / 2) * scale);
		};
		this.resize = new ResizeObserver(layout);
		this.resize.observe(this.host!);
		layout();
		this.app.canvas.style.visibility = 'visible';
		this.app.start();
		monster.state.setAnimation(0, animation, false);
		monster.state.addListener({ complete: () : void => { queueMicrotask(finish); } });
	};

	destroy = () : void => {
		if (__SPINE__) {
			this.finish?.();
			this.generation ++;
			this.resize?.disconnect();
			this.resize = undefined;
			this.app?.destroy(true, { children: true });
			this.app = undefined;
			this.monster = undefined;
			this.host?.remove();
			this.host = undefined;
		}
	};
};

export { Summon };