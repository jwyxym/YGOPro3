import { defineComponent, reactive } from 'vue';
import PQueue from 'p-queue';
import { prepare, layout } from '@chenglou/pretext';

import mainGame from '@/script/game';

type HintType = 'info' | 'warn' | 'err';
type HintStatus = 'unshow' | 'show' | 'leave';
interface Hint {
	text : string | number | string;
	type : HintType;
	top : number;
	status : HintStatus;
	id : string;
	height : number;
};

class _Toast {
	list : Array<Hint> = reactive([]);
	elements : Map<Hint, HTMLDivElement> = new Map()
	time : number = 10;
	chk : boolean = false;
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});

	set_elements = (el : HTMLDivElement | null, key : Hint) => el ? this.elements.set(key, el) : this.elements.delete(key);

	clear = () => this.queue.add(async () => {
		this.list.forEach(i => i.status = 'leave');
		await mainGame.sleep(200);
		this.list.length = 0;
	});

	splice = (v : number) => {
		this.list[v].status = 'leave';
		const offset = this.list[v].height + 20;

		for (let i = v + 1; i < this.list.length; i++)
			this.list[i].top -= offset;

		setTimeout(() => this.list.splice(v, 1), 100);
	};

	push = (str : string | number, type : HintType) => {
		const obj = this.to_toast(str, type);

		this.queue.add(async () => {
			this.list.splice(0, 0, obj);

			for (let i = 1; i < this.list.length; i++)
				this.list[i].top += obj.height + 20;

			const div = this.list[0];
			setTimeout(() => {
				if (div.status === 'unshow') div.status = 'show';
			}, 100);

			const time = this.time * 1000;
			setTimeout(() => {
				if (div.status === 'show') div.status = 'leave';
			}, 100 + time);

			setTimeout(() => {
				const ct = this.list.indexOf(obj);
				if (ct > -1)
					this.list.splice(ct, 1);
			}, 200 + time);

			await mainGame.sleep(200);
		});
	};

	error = (str : string | number) : void => {
			this.push(str, 'err');
	};

	info = (str : string | number) : void => {
			this.push(str, 'info');
	};

	warn = (str : string | number) : void => {
			this.push(str, 'warn');
	};

	to_toast = (str : string | number, type : HintType) : Hint => {
		const prepared = prepare(`${str}`, '16px Inter');
		const height = Math.max(70, layout(prepared, 270, 22).height);
		return {
			text : str,
			type : type,
			top : 0,
			status : 'unshow',
			id : 'toast' + Math.random(),
			height : height
		};
	}
};

const toast = new _Toast();

const Toast = defineComponent({
	setup () {
		return () =>
			<div class = 'toast'>
				{toast.list.map((i, v) =>
					<div
						class = {[i.type, i.status]}
						id = {i.id}
						key = {i.id}
						style = {{ '--top' : `${i.top}px`, '--time' : `${toast.time}s` }}
						ref = {(el) => toast.set_elements(el as HTMLDivElement | null, i)}
					>
						<div>
							<p>{i.text}</p>
						</div>
						<div class = 'pointer' onClick = {toast.splice.bind(null, v)}>
							<span>&times;</span>
						</div>
					</div>
				)}
			</div>;
	},
});

export default Toast;
export { toast };
export type { Hint };
