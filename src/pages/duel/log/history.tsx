import { defineComponent, onMounted, reactive } from 'vue';
import PQueue from 'p-queue';
import mainGame from '@/script/game';

class HistoryMsg {
	type : number;
	content : any;
	constructor(type : number, content : any) {
		this.type = type;
		this.content = content;
	}
};

class _History {
	element : HTMLDivElement | null = null;
	msg : Array<HistoryMsg> = reactive([]);
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	push = (msg : HistoryMsg) => this.queue.add(
		async () => {
			this.msg.push(msg);
			if (!this.element) return;
			const { scrollTop, scrollHeight, clientHeight } = this.element;
			if (scrollTop + clientHeight > scrollHeight - 10) {
				await mainGame.sleep(100);
				this.element.scrollTop = scrollHeight;
			}
			await mainGame.sleep(100);
		}
	);
	clear = () => this.msg.length = 0;
};

const history = new _History ();
const History  = defineComponent({
	name : 'history',
	setup () {
		onMounted(() => {
			const el = history.element;
			if (el) {
				el.scrollTop = el.scrollHeight;
				el.style.scrollBehavior = 'smooth';
			}
		});
		return () => <div class = 'history no-scrollbar' ref = {(el) => history.element = el as HTMLDivElement | null}>
			{history.msg.map(i => {
				switch (i.type) {
					case 0:
						return <div class = {['history__card__move',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<div>
								<img src = {i.content.card_src}/>
								<div>
									<span>{i.content.card_desc}</span>
								</div>
							</div>
							<div>
								<b>{i.content.desc}</b>
							</div>
						</div>
				}
			})}
		</div>;
	},
});

export default History;
export { history };