import { defineComponent, nextTick, reactive, ComponentPublicInstance } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
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
	index : number;
	content : HistoryContent;
	constructor(type : number, content :  HistoryContent, index : number = 0) {
		this.type = type;
		this.content = content;
		this.index = index;
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
			const msg = type instanceof HistoryMsg ? type as HistoryMsg : new HistoryMsg(type, content!, this.msg.length);
			this.msg.push(msg);
			await nextTick();
			if (!this.element) return;
			const { scrollTop, scrollHeight, clientHeight } = this.element;
			if (scrollTop + clientHeight > scrollHeight - 180)
				this.element.scrollTop = scrollHeight;
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
	emits : {
		click : (_ : number | string) => true
	},
	setup (_, { emit }) {
		return () => <RecycleScroller
			class = 'history no-scrollbar'
			ref = {(el) => history.element = (el as ComponentPublicInstance | null)?.$el as HTMLDivElement ?? null}
			keyField = 'index'
			items = {history.msg}
			item-size = {80}
			v-slots={{
				default : ({ item } : { item : HistoryMsg }) => {
					switch (item.type) {
						case HISTORY.MOVE:
							return <div class = {['history__card__move',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Pic
									id = {item.content.cards[0].id}
									pos = {item.content.cards[0].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
								<Desc
									position = {true}
									desc = {item.content.from + ' → ' + item.content.to}
								/>
							</div>;
						case HISTORY.BATTEL:
							return <div class = {['history__card__battel',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Pic
									id = {item.content.cards[0].id}
									pos = {item.content.cards[0].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
								<Desc
									desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_BATTLE) + ' →'}
								/>
								<Pic
									id = {item.content.cards[1].id}
									pos = {item.content.cards[1].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
							</div>;
						case HISTORY.ANNOUNCE:
							let content
							{
								if (item.content.cards.length)
									content = <Pic
										id = {item.content.cards[0].id}
										onClick = {(v : number | string) => emit('click', v)}
									/>
								else if (item.content.number !== undefined)
									content = <Num
										number = {item.content.number}
									/>
							}
							return <div class = {['history__announce',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Avatar
									avatar = {item.content.avatar!}
									self = {item.content.self}
								/>
								<div>
									<Desc
										desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_ANNOUNCE) + ' →'}
									/>
									{content}
								</div>;
							</div>;
						case HISTORY.LP:
							return <div class = {['history__lp',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Avatar
									avatar = {item.content.avatar!}
									self = {item.content.self}
								/>
								<Num
									number = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_LP) + ' : ' + item.content.number!}
								/>
							</div>;
						case HISTORY.DRAW:
							return <div class = {['history__draw',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Avatar
									avatar = {item.content.avatar!}
									self = {item.content.self}
								/>
								<Cards
									cards = {item.content.cards.map(i => i.id)}
									width = {300}
									onClick = {(v : number | string) => emit('click', v)}
								/>
							</div>;
						case HISTORY.POS_CHANGE:
							return <div class = {['history__pos',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Pic
									id = {item.content.cards[0].id}
									pos = {item.content.cards[0].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
								<Desc
									desc = ' →'
								/>
								<Pic
									id = {item.content.cards[1].id}
									pos = {item.content.cards[1].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
							</div>;
						case HISTORY.DECK_COUNT:
							return <div class = {['history__deck__count',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Cover/>
								<Desc
									desc = {String(item.content.number!)}
									position = {true}
								/>
							</div>;
						case HISTORY.CHAINING:
							return <div class = {['history__chaining',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Pic
									id = {item.content.cards[0].id}
									pos = {item.content.cards[0].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
								<Desc desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_CHAINING, item.content.number!)} />
							</div>;
						case HISTORY.CHAIN_SOLVED:
							return <div class = {['history__chain_sloved',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Pic
									id = {item.content.cards[0].id}
									pos = {item.content.cards[0].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
								<Desc desc = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_CHAIN_SOLVED, item.content.number!)} />
							</div>;
						case HISTORY.CONFIRM:
							return <div class = {['history__confirm',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Avatar
									avatar = {item.content.avatar!}
									self = {item.content.self}
								/>
								<Pic
									id = {item.content.cards[0].id}
									pos = {item.content.cards[0].pos}
									onClick = {(v : number | string) => emit('click', v)}
								/>
							</div>;
						case HISTORY.PHASE:
							return <div class = {['history__phase',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Avatar
									avatar = {item.content.avatar!}
									self = {item.content.self}
								/>
								<Num
									number = {Phase.get(item.content.number as number)!}
								/>
							</div>;
						case HISTORY.TURN:
							return <div class = {['history__phase',
									item.content.self ? 'history__self' : 'history__oppo'
								]}>
								<Avatar
									avatar = {item.content.avatar!}
									self = {item.content.self}
								/>
								<Num
									number = {mainGame.get.text(I18N_KEYS.DUEL_HISTORY_TURN, item.content.number!)}
								/>
							</div>;
					}
				}
			}}
		/>;
	},
});

export default History;
export { history, HISTORY, HistoryMsg };
