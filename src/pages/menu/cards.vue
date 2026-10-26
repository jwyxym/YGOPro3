<template>
	<canvas ref = 'canvas'/>
</template>
<script setup lang = 'ts'>
	import { onMounted, onUnmounted, watch, useTemplateRef, type TemplateRef } from 'vue';
	import Matter from 'matter-js';

	import mainGame from '@/script/game';
	import Card from '@/script/card';

	const canvas : TemplateRef<HTMLCanvasElement> = useTemplateRef('canvas');
	const props = withDefaults(defineProps<{
		active ?: boolean;
	}>(), {
		active : true
	});

	const page = {
		width : 800,
		height : 450,
		wall_size : 100,
		ground_height : 20,
		card_height : 90,
		spawn_interval : 50,
		spawn_timer : undefined as number | undefined,
		pending_images : [] as Array<HTMLImageElement>,
		ready : false,
		running : false,
		engine : Matter.Engine.create(),
		runner : Matter.Runner.create(),
		render : undefined as Matter.Render | undefined,
		mouse : undefined as Matter.Mouse | undefined,
		sync_mouse : () : void => {
			if (!page.render || !page.mouse)
				return;
			const bounds : DOMRect = page.render.canvas.getBoundingClientRect();
			if (bounds.width <= 0 || bounds.height <= 0)
				return;
			Matter.Mouse.setScale(page.mouse, {
				x : page.render.canvas.clientWidth / bounds.width,
				y : page.render.canvas.clientHeight / bounds.height
			});
		},
		release : () : void => {
			if (page.mouse)
				page.mouse.button = -1;
		},
		pointer_down : (event : PointerEvent) : void => {
			if (event.button !== 0 || !page.render)
				return;
			page.sync_mouse();
			page.render.canvas.setPointerCapture(event.pointerId);
		},
		constrain_pointer : () : void => {
			if (!page.mouse)
				return;
			page.mouse.position.x = Math.max(0, Math.min(page.width, page.mouse.position.x));
			page.mouse.position.y = Math.max(0, Math.min(page.height - page.ground_height, page.mouse.position.y));
		},
		keep_inside : () : void => {
			Matter.Composite.allBodies(page.engine.world).forEach((body : Matter.Body) : void => {
				if (body.isStatic)
					return;
				let left : number = Infinity;
				let right : number = -Infinity;
				let top : number = Infinity;
				let bottom : number = -Infinity;
				body.vertices.forEach((vertex : Matter.Vector) : void => {
					left = Math.min(left, vertex.x);
					right = Math.max(right, vertex.x);
					top = Math.min(top, vertex.y);
					bottom = Math.max(bottom, vertex.y);
				});
				const x : number = left < 0 ? -left : right > page.width ? page.width - right : 0;
				const y : number = top < 0 ? -top : bottom > page.height - page.ground_height ? page.height - page.ground_height - bottom : 0;
				if (!x && !y)
					return;
				Matter.Body.setPosition(body, { x : body.position.x + x, y : body.position.y + y });
				Matter.Body.setVelocity(body, {
					x : x * body.velocity.x < 0 ? 0 : body.velocity.x,
					y : y * body.velocity.y < 0 ? 0 : body.velocity.y
				});
			});
		},
		cards : async (count : number) : Promise<Array<Card>> => {
			const values : Array<Card> = Array.from(mainGame.cards.values());
			count = Math.min(count, values.length);
			for (let i : number = values.length - 1; i > 0; i--) {
				const j : number = Math.floor(Math.random() * (i + 1));
				[values[i], values[j]] = [values[j], values[i]];
			}
			const result : Array<Card> = values.slice(0, count);
			await mainGame.load.pic(result);
			return result;
		},
		spawn_next : function () : void {
			this.spawn_timer = undefined;
			if (!this.render || !this.running)
				return;
			const image : HTMLImageElement | undefined = this.pending_images.shift();
			if (!image)
				return;
			const scale : number = this.card_height / image.naturalHeight;
			const card_width : number = image.naturalWidth * scale;
			const body : Matter.Body = Matter.Bodies.rectangle(300, 100, card_width, this.card_height, {
				restitution : 0.4,
				render : {
					sprite : {
						texture : image.src,
						xScale : scale,
						yScale : scale
					}
				}
			});
			Matter.Composite.add(this.engine.world, body);
			if (this.pending_images.length)
				this.spawn_timer = window.setTimeout(() : void => this.spawn_next(), this.spawn_interval);
		},
		resume : function () : void {
			if (!props.active || !this.ready || !this.render || this.running)
				return;
			this.running = true;
			this.sync_mouse();
			Matter.Runner.run(this.runner, this.engine);
			Matter.Render.run(this.render);
			if (this.pending_images.length)
				this.spawn_timer = window.setTimeout(() : void => this.spawn_next(), this.spawn_interval);
		},
		pause : function () : void {
			this.running = false;
			if (this.spawn_timer !== undefined)
				window.clearTimeout(this.spawn_timer);
			this.spawn_timer = undefined;
			this.release();
			if (this.mouse)
				Matter.Mouse.clearSourceEvents(this.mouse);
			Matter.Runner.stop(this.runner);
			if (this.render)
				Matter.Render.stop(this.render);
		},
		init : async function () : Promise<void> {
			if (!canvas.value)
				return;

			this.render = Matter.Render.create({
				canvas : canvas.value,
				engine : this.engine,
				options : {
					width : this.width,
					height : this.height,
					wireframes : false,
					showSleeping : false,
					background : 'transparent'
				}
			});
			this.mouse = Matter.Mouse.create(this.render.canvas);
			this.sync_mouse();
			this.render.canvas.addEventListener('pointerdown', this.pointer_down);
			this.render.canvas.addEventListener('pointermove', this.sync_mouse);
			this.render.canvas.addEventListener('lostpointercapture', this.release);
			window.addEventListener('pointerup', this.release);
			window.addEventListener('pointercancel', this.release);
			window.addEventListener('blur', this.release);
			Matter.Events.on(this.engine, 'beforeUpdate', this.constrain_pointer);
			Matter.Events.on(this.engine, 'afterUpdate', this.keep_inside);
			
			const drag : Matter.MouseConstraint = Matter.MouseConstraint.create(
				this.engine,
				{
					mouse : this.mouse,
					constraint : {
						stiffness : 0.2,
						render : {
							visible : false
						}
					}
				}
			);

			Matter.Composite.add(this.engine.world, drag);
			
			this.render.mouse = this.mouse;

			const ground : Matter.Body = Matter.Bodies.rectangle(
				this.width / 2, this.height - this.ground_height / 2, this.width + this.wall_size * 2, this.ground_height,
				{ isStatic : true, render : { visible : false } }
			);
			const wall_options : Matter.IChamferableBodyDefinition = {
				isStatic : true,
				render : { visible : false }
			};
			const walls : Array<Matter.Body> = [
				Matter.Bodies.rectangle(this.width / 2, -this.wall_size / 2, this.width + this.wall_size * 2, this.wall_size, wall_options),
				Matter.Bodies.rectangle(-this.wall_size / 2, this.height / 2, this.wall_size, this.height + this.wall_size * 2, wall_options),
				Matter.Bodies.rectangle(this.width + this.wall_size / 2, this.height / 2, this.wall_size, this.height + this.wall_size * 2, wall_options)
			];

			const cards : Array<HTMLImageElement> = (await this.cards(30)).map((card : Card) : HTMLImageElement => {
				const image : HTMLImageElement = new Image();
				image.src = card.pic;
				return image;
			});
			await Promise.all(cards.map((image : HTMLImageElement) : Promise<void> => image.decode()));
			if (!this.render)
				return;

			Matter.Composite.add(this.engine.world, [ground, ...walls]);
			this.pending_images = cards;
			this.ready = true;
			this.resume();
		},
		clear : function () : void {
			this.pause();
			this.ready = false;
			this.pending_images = [];
			if (this.render) {
				this.render.canvas.removeEventListener('pointerdown', this.pointer_down);
				this.render.canvas.removeEventListener('pointermove', this.sync_mouse);
				this.render.canvas.removeEventListener('lostpointercapture', this.release);
			}
			window.removeEventListener('pointerup', this.release);
			window.removeEventListener('pointercancel', this.release);
			window.removeEventListener('blur', this.release);
			if (this.mouse)
				Matter.Mouse.clearSourceEvents(this.mouse);
			Matter.Events.off(this.engine, 'beforeUpdate');
			Matter.Events.off(this.engine, 'afterUpdate', this.keep_inside);
			Matter.Composite.clear(this.engine.world, false);
			Matter.Engine.clear(this.engine);
			this.mouse = undefined;
			this.render = undefined;
		}
	};

	onMounted(() : Promise<void> => page.init());
	onUnmounted(() : void => page.clear());
	watch(() : boolean => props.active,
		(active : boolean) : void => active ? page.resume() : page.pause(),
		{ flush : 'post' }
	);
</script>
<style scoped lang = 'scss'>
	canvas {
		display: block;
		width: 100%;
		height: auto;
		touch-action: none;
		user-select: none;
		cursor: grab;
		&:active {
			cursor: grabbing;
		}
	}
</style>
