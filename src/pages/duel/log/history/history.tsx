import { defineComponent, onMounted, reactive } from 'vue';
import PQueue from 'p-queue';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';

import Pic from './pic';
import Desc from './desc';

const HISTORY = {
	MOVE : 0,
	BATTEL : 1,
}

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
					case HISTORY.MOVE:
						return <div class = {['history__card__move',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								src = {i.content.card.src}
								desc = {i.content.card.desc}
							/>
							<Desc
								position = {true}
								desc = {i.content.desc}
							/>
						</div>
					case HISTORY.BATTEL:
						return <div class = {['history__card__battel',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								src = {i.content.attacker.src}
								desc = {i.content.attacker.desc}
							/>
							<Desc
								desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_BATTLE)}
							/>
							<Pic
								src = {i.content.defender.src}
								desc = {i.content.defender.desc}
							/>
						</div>
				}
			})}
		</div>;
	},
});

export default History;
export { history, HISTORY };