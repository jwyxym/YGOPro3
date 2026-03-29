import { defineComponent, onMounted, reactive } from 'vue';
import PQueue from 'p-queue';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';

import Pic from './pic';
import Desc from './desc';
import Avatar from './avatar';
import Num from './number';
import Cards from './cards'

const HISTORY = {
	MOVE : 0,
	BATTEL : 1,
	ANNOUNCE : 2,
	LP : 3,
	DRAW : 4
}

interface HistoryContent {
	self : boolean;
	from ?: string;
	to ?: string;
	avatar ?: string;
	number ?: number;
	attribute ?: number;
	race ?: number;
	cards : Array<string>;
};

class HistoryMsg {
	type : number;
	content :  HistoryContent;
	constructor(type : number, content :  HistoryContent) {
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
								src = {i.content.cards[0]}
							/>
							<Desc
								position = {true}
								desc = {i.content.from! + ' → ' + i.content.to}
							/>
						</div>
					case HISTORY.BATTEL:
						return <div class = {['history__card__battel',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								src = {i.content.cards[0]}
							/>
							<Desc
								desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_BATTLE) + ' →'}
							/>
							<Pic
								src = {i.content.cards[1]}
							/>
						</div>
					case HISTORY.ANNOUNCE:
						let content
						{
							if (i.content.cards.length)
								content = <Pic
									src = {i.content.cards[0]}
								/>
							else if (i.content.number !== undefined)
								content = <Num
									number = {i.content.number}
								/>
						}
						return <div class = {['history__card__announce',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<div>
								<Desc
									desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_ANNOUNCE) + ' →'}
								/>
								{content}
							</div>
						</div>
					case HISTORY.LP:
						return <div class = {['history__card__lp',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<Num
								number = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_LP) + ' : ' + i.content.number!}
							/>
						</div>
					case HISTORY.DRAW:
						return <div class = {['history__card__draw',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<Cards
								cards = {i.content.cards}
								width = {300}
							/>
						</div>
				}
			})}
		</div>;
	},
});

export default History;
export { history, HISTORY, HistoryMsg };