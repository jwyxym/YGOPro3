import { defineComponent, onMounted, reactive } from 'vue';
import PQueue from 'p-queue';
import mainGame from '@/script/game';
import { I18N_KEYS } from '@/script/language/i18n';

import { PHASE } from '@/pages/duel/ygo-protocol/network';

import Pic from './pic';
import Desc from './desc';
import Avatar from './avatar';
import Num from './number';
import Cards from './cards'
import Cover from './cover'

const HISTORY = {
	MOVE : 0,
	BATTEL : 1,
	ANNOUNCE : 2,
	LP : 3,
	DRAW : 4,
	POS_CHANGE : 5,
	DECK_COUNT : 6,
	CHAINING : 7,
	CHAIN_SOLVED : 8,
	CONFIRM : 9,
	PHASE : 10,
	TURN : 11,
}

interface HistoryContent {
	self : boolean;
	from ?: string;
	to ?: string;
	avatar ?: string;
	number ?: number | string;
	attribute ?: number;
	race ?: number;
	cards : Array<{
		id : string | number;
		pos : number;
	}>;
};

class HistoryMsg {
	type : number;
	content : HistoryContent;
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
	push = (type : HistoryMsg | number, content ?: HistoryContent) => this.queue.add(
		async () => {
			const msg = type instanceof HistoryMsg ? type as HistoryMsg : new HistoryMsg(type, content!);
			this.msg.push(msg);
			if (!this.element) return;
			const { scrollTop, scrollHeight, clientHeight } = this.element;
			if (scrollTop + clientHeight > scrollHeight - 80) {
				await mainGame.sleep(100);
				this.element.scrollTop = scrollHeight;
			}
			await mainGame.sleep(100);
		}
	);
	clear = () => this.msg.length = 0;
};

const history = new _History ();


const Phase = new Map([
	[PHASE.NONE, mainGame.get.text(I18N_KEYS.DUEL_PHASE_NEW)],
	[PHASE.DRAW, mainGame.get.text(I18N_KEYS.DUEL_PHASE_DRAW)],
	[PHASE.STANDBY, mainGame.get.text(I18N_KEYS.DUEL_PHASE_STANDBY)],
	[PHASE.MAIN1, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN1)],
	[PHASE.BATTLE_START, mainGame.get.text(I18N_KEYS.DUEL_PHASE_BATTLE)],
	[PHASE.MAIN2, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN2)],
	[PHASE.END, mainGame.get.text(I18N_KEYS.DUEL_PHASE_END)],
]);

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
								id = {i.content.cards[0].id}
								pos = {i.content.cards[0].pos}
							/>
							<Desc
								position = {true}
								desc = {i.content.from + ' → ' + i.content.to}
							/>
						</div>
					case HISTORY.BATTEL:
						return <div class = {['history__card__battel',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								id = {i.content.cards[0].id}
								pos = {i.content.cards[0].pos}
							/>
							<Desc
								desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_BATTLE) + ' →'}
							/>
							<Pic
								id = {i.content.cards[1].id}
								pos = {i.content.cards[1].pos}
							/>
						</div>
					case HISTORY.ANNOUNCE:
						let content
						{
							if (i.content.cards.length)
								content = <Pic
									id = {i.content.cards[0].id}
								/>
							else if (i.content.number !== undefined)
								content = <Num
									number = {i.content.number}
								/>
						}
						return <div class = {['history__announce',
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
						return <div class = {['history__lp',
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
						return <div class = {['history__draw',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<Cards
								cards = {i.content.cards.map(i => i.id)}
								width = {300}
							/>
						</div>
					case HISTORY.POS_CHANGE:
						return <div class = {['history__pos',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								id = {i.content.cards[0].id}
								pos = {i.content.cards[0].pos}
							/>
							<Desc
								desc = ' →'
							/>
							<Pic
								id = {i.content.cards[1].id}
								pos = {i.content.cards[1].pos}
							/>
						</div>
					case HISTORY.DECK_COUNT:
						return <div class = {['history__deck__count',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Cover/>
							<Desc
								desc = {String(i.content.number!)}
								position = {true}
							/>
						</div>
					case HISTORY.CHAINING:
						return <div class = {['history__chaining',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								id = {i.content.cards[0].id}
								pos = {i.content.cards[0].pos}
							/>
							<Desc desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_CHAINING, i.content.number!)} />
						</div>
					case HISTORY.CHAIN_SOLVED:
						return <div class = {['history__chain_sloved',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Pic
								id = {i.content.cards[0].id}
								pos = {i.content.cards[0].pos}
							/>
							<Desc desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_CHAIN_SOLVED, i.content.number!)} />
						</div>
					case HISTORY.CONFIRM:
						return <div class = {['history__confirm',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<Pic
								id = {i.content.cards[0].id}
								pos = {i.content.cards[0].pos}
							/>
						</div>
					case HISTORY.PHASE:
						return <div class = {['history__phase',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<Num
								number = {Phase.get(i.content.number as number)!}
							/>
						</div>
					case HISTORY.TURN:
						return <div class = {['history__phase',
								i.content.self ? 'history__self' : 'history__oppo'
							]}>
							<Avatar
								avatar = {i.content.avatar!}
								self = {i.content.self}
							/>
							<Num
								number = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_TURN, i.content.number!)}
							/>
						</div>
				}
			})}
		</div>;
	},
});

export default History;
export { history, HISTORY, HistoryMsg };