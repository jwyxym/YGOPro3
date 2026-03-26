import { defineComponent, onMounted, reactive } from 'vue';
import PQueue from 'p-queue';
import mainGame from '@/script/game';

class ChatMsg {
	self : boolean;
	name : string;
	msg : string;
	avatar : string;

	constructor (name : string, msg : string, avatar : string, self : boolean = false) {
		this.self = self;
		this.name = name;
		this.msg = msg;
		this.avatar = avatar;
	};
};

class _Chat {
	element : HTMLDivElement | null = null;
	msg : Array<ChatMsg> = reactive([]);
	queue = new PQueue({ 
		concurrency: 1,
		autoStart: true
	});
	push = (msg : ChatMsg) => this.queue.add(
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

const chat = new _Chat ();

const Chat  = defineComponent({
	name : 'chat',
	setup () {
		onMounted(() => {
			const el = chat.element;
			if (el) {
				el.scrollTop = el.scrollHeight;
				el.style.scrollBehavior = 'smooth';
			}
		});
		return () => <div class = 'chat no-scrollbar' ref = {(el) => chat.element = el as HTMLDivElement | null}>
			{chat.msg.map(i =>
				<q-text
					name = {i.name}
					avatar = {i.avatar}
					self = {i.self}
				>
					{i.msg}
				</q-text>
			)}
		</div>;
	},
});

export default Chat;
export { chat, ChatMsg };