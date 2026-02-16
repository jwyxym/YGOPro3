<template>
	<div class = 'server'>
		<transition name = 'opacity'>
			<div class = 'address' v-if = 'page.server'>
				<var-list>
					<var-cell>
						<template #default>
							<Input
								:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_NAME)'
								v-model = 'server.name'
							/>
						</template>
					</var-cell>
					<var-cell>
						<template #default>
							<AutoInput
								:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_ADDRESS)'
								:options = server.options
								v-model = 'server.address'
							/>
						</template>
					</var-cell>
					<var-cell>
						<template #default>
							<Input
								:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_PASSWORD)'
								v-model = 'server.pass'
							/>
						</template>
					</var-cell>
				</var-list>
			</div>
		</transition>
		<transition name = 'opacity'>
			<div class = 'wait' v-if = 'page.wait'>
				<var-list>
					<var-cell>
						<template #default>
							<div class = 'buttons'>
								<Button
									@click = 'connect.to.duelist'
									:content = 'mainGame.get.text(I18N_KEYS.SERVER_TO_DUELIST)'
									:class = "{ 'readonly' : connect.self < 4 && connect.home.mode !== 2 }"
								></Button>
								<Button
									@click = 'connect.to.watcher'
									:content = 'mainGame.get.text(I18N_KEYS.SERVER_TO_WATCHER)'
									:class = "{ 'readonly' : connect.self >= 4 }"
								></Button>
								{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_WATCH)} : ${connect.home.watch}` }}
							</div>
						</template>
					</var-cell>
					<var-cell
						v-for = '(i, v) in connect.player.slice(0, connect.home.mode === 2 ? 4 : 2)'
						:title = 'i.name'
						:border = 'true'
						:key = 'v'
					>
						<template #extra>
							<div class = 'check_ready' v-if = 'i.ready !== undefined'>
								<var-checkbox
									class = 'readonly'
									:readonly = 'true'
									v-model = 'i.ready'
								></var-checkbox>
								<var-icon
									v-if = 'connect.is_host'
									:color = "connect.self === v ? '#555' : 'white'"
									name = 'close-circle-outline'
									@click = 'connect.kick(v)'
								/>
							</div>
						</template>
					</var-cell>
					<var-cell class = 'select_deck'>
						<template #default>
							<Select
								name = 'deck'
								v-model = 'connect.deck'
								@change = 'connect.ready'
								:rules = 'connect.rule'
							></Select>
						</template>
					</var-cell>
				</var-list>
			</div>
		</transition>
		<transition name = 'move_right'>
			<div class = 'info' v-if = 'page.info.chk' ref = 'info'>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_LFLIST)} : ${mainGame.get.lflist(connect.home.lflist)}` }}</span>
				<span>
					{{
						`${mainGame.get.text(I18N_KEYS.SERVER_HOME_RULE)} : ${mainGame.get.text([
							I18N_KEYS.SERVER_RULE_OCG, I18N_KEYS.SERVER_RULE_TCG, I18N_KEYS.SERVER_RULE_SC, I18N_KEYS.SERVER_RULE_CUSTOM, I18N_KEYS.SERVER_RULE_NO_EXCLUSIVE, I18N_KEYS.SERVER_RULE_ALL
						][connect.home.rule] ?? I18N_KEYS.UNKNOW)}`
					}}
				</span>
				<span>
					{{
						`${mainGame.get.text(I18N_KEYS.SERVER_HOME_MODE)} : ${mainGame.get.text([
							I18N_KEYS.SERVER_MODE_SINGLE, I18N_KEYS.SERVER_MODE_MATCH, I18N_KEYS.SERVER_MODE_TAG
						][connect.home.mode] ?? I18N_KEYS.UNKNOW)}`
					}}
				</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_TIME_LIMIT)} : ${connect.home.time_limit}` }}</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_START_LP)} : ${connect.home.start_lp}` }}</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_START_HAND)} : ${connect.home.start_hand}` }}</span>
				<span v-show = 'connect.home.no_check_deck'>{{ mainGame.get.text(I18N_KEYS.SERVER_NO_CHECK_DECK) }}</span>
				<span v-show = 'connect.home.no_shuffle_deck'>{{ mainGame.get.text(I18N_KEYS.SERVER_NO_SHUFFLE_DECK) }}</span>
			</div>
		</transition>
		<TransitionGroup tag = 'div' name = 'opacity'>
			<Duel
				v-if = 'page.duel && connect.deck_count.length > 0'
				key = 'Duel'
				:connect = 'connect'
				@update:duel = 'connect.duel = $event'
			></Duel>
			<RPS
				v-if = 'page.duel && connect.rps.chk'
				key = 'RPS'
				:connect = 'connect'
			></RPS>
			<Avatar
				v-if = 'page.duel && connect.deck_count.length > 0'
				class = 'avatar_self'
				key = 'Avatar_self'
				:lp = 'connect.lp.ct[0]'
				:name = 'connect.player[connect.self].name'
				:src = 'mainGame.get.avatar(0)'
				:time = 'connect.time.this[0]'
				:time_player = 'connect.time.palyer'
				:tp = '0'
				color = 'blue'
			/>
			<Avatar
				v-if = 'page.duel && connect.deck_count.length > 0'
				class = 'avatar_oppo'
				key = 'Avatar_oppo'
				:lp = 'connect.lp.ct[1]'
				:name = 'connect.player[connect.home.mode === 2 ? connect.self < 2 ? 2 : 0 : 1 - connect.self].name'
				:src = 'mainGame.get.avatar(1)'
				:time = 'connect.time.this[1]'
				:time_player = 'connect.time.palyer'
				:tp = '1'
				color = 'red'
			/>
		</TransitionGroup>
		<var-popup v-model:show = 'connect.is_first.selecting' :overlay = 'false' :close-on-key-escape = 'false' :close-on-click-overlay = 'false'>
			<div class = 'select_tp'>
				<Button
					@click = 'connect.is_first.select(1)'
					:content = 'mainGame.get.text(I18N_KEYS.SERVER_PLAYER_FIRST)'
				></Button>
				<Button
					@click = 'connect.is_first.select(0)'
					:content = 'mainGame.get.text(I18N_KEYS.SERVER_PLAYER_NEXT)'
				></Button>
			</div>
		</var-popup>
		<var-popup v-model:show = 'page.chat.chk' :overlay = 'false' position = 'right'>
			<div class = 'chat' ref = 'chat'>
				<var-tabs v-model:active = 'page.chat.ct'>
					<var-tab>{{ mainGame.get.text(I18N_KEYS.DUEL_CHAT) }}</var-tab>
					<var-tab>{{ mainGame.get.text(I18N_KEYS.DUEL_HISTORY) }}</var-tab>
				</var-tabs>
				<TransitionGroup tag = 'div' name = 'move_right' class = 'content'>
					<ConversationBlock
						class = 'message'
						:list = 'connect.chat.list'
						:userOptions = "{ position: 'left' }"
						:answerOptions = "{ position: 'right' }"
						:key = '0'
						v-show = 'page.chat.ct === 0'
					/>
					<div class = 'send' :key = '1' v-show = 'page.chat.ct === 0'>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_CHAT)'
							v-model = 'server.chat'
							@keydown = 'connect.chat.press'
							@clear = 'connect.chat.clear'
						/>
						<Button
							@click = 'connect.chat.send'
							icon_name = 'chat'
						></Button>
						<Button
							@click = 'server.voice_input.shift'
							icon_name = 'microphone'
							v-if = 'voice_input.chk()'
							:class = "{ 'voice_input' : server.voice_input.chk }"
						></Button>
					</div>
					<div class = 'history' :key = '2' v-show = 'page.chat.ct === 1'>
					</div>
				</TransitionGroup>
			</div>
		</var-popup>
		<transition name = 'move_right'>
			<Float_Buttons
				ref = 'float_buttons'
				v-show = '!page.chat.chk && !page.info.chk && (
					page.server || page.wait || page.duel
				)'
				:list = "[
					{
						click : page.server ? page.connect : connect.start,
						loading : page.loading,
						icon : 'socket',
						show : page.server || (page.wait && connect.is_host)
					}, {
						click : page.chat.shift,
						icon : 'chat',
						show : page.wait || page.duel
					}, {
						click : connect.surrender,
						icon : 'flag',
						show : page.duel
					}, {
						click : page.info.shift,
						icon : 'info',
						show : page.wait
					}, {
						click : connect.chat.robot,
						icon : 'add_person',
						show : page.wait
					}, {
						click : page.server ? page.exit : page.disconnect,
						icon : 'exit',
						show : page.server || page.wait
					}
				]"
			/>
		</transition>
		<transition name = 'move_right'>
			<Card_List
				:cards = 'connect.cards'
				v-if = 'page.duel && connect.cards.length > 0'
			/>
		</transition>
		<transition name = 'move_right'>
			<Chain_List
				:cards = 'connect.chains'
				v-if = 'page.duel && connect.chains.length > 0'
			/>
		</transition>
		<transition name = 'move_up'>
			<Group_Select_List
				:title = 'connect.select.group.title'
				:min = 'connect.select.group.min'
				:max = 'connect.select.group.max'
				:list = 'connect.select.group.list'
				:confirm = 'connect.response'
				:cancel = 'connect.select.group.cancel'
				v-if = 'page.duel && connect.select.group.chk'
				ref = 'select'
			/>
		</transition>
		<transition name = 'move_up'>
			<Card_Select_List
				:title = 'connect.select.cards.title'
				:min = 'connect.select.cards.min'
				:max = 'connect.select.cards.max'
				:cards = 'connect.select.cards.array'
				:confirm = 'connect.select.cards.confirm'
				:cancel = 'connect.select.cards.cancel'
				v-if = 'page.duel && connect.select.cards.array.length > 0'
				v-show = 'connect.select.cards.show'
				ref = 'select'
			/>
		</transition>
		<transition name = 'move_up'>
			<Plaid_Select_List
				:title = 'connect.select.plaids.title'
				:min = 'connect.select.plaids.min'
				:plaids = 'connect.select.plaids.array'
				:confirm = 'connect.select.plaids.confirm'
				:cancel = 'connect.select.plaids.cancel'
				v-if = 'page.duel && connect.select.plaids.array.length > 0'
				v-show = 'connect.select.plaids.show'
				ref = 'select'
			/>
		</transition>
		<transition name = 'move_up'>
			<Pos_Select_List
				:title = 'connect.select.position.title'
				:code = 'connect.select.position.code'
				:pos = 'connect.select.position.pos'
				:confirm = 'connect.select.position.select'
				v-if = 'page.duel && connect.select.position.pos > 0 && connect.select.position.code > 0'
				ref = 'select'
			/>
		</transition>
		<transition name = 'move_up'>
			<Idles_Select_List
				:title = 'connect.select.idles.title'
				:cards = 'connect.select.idles.array'
				:confirm = 'connect.select.idles.select'
				:cancel = 'connect.select.idles.cancel'
				v-if = 'page.duel && connect.select.idles.array.length > 0'
				v-show = 'connect.select.idles.show'
				ref = 'select'
			/>
		</transition>
		<Phase
			v-if = 'page.duel && connect.deck_count.length > 0'
			:phase = 'connect.phase'
		/>
	</div>
</template>
<script setup lang = 'ts'>
	import { ref, Ref, reactive, onBeforeMount, onMounted, computed, watch, TransitionGroup, onUnmounted } from 'vue';
	import { ConversationBlock } from 'conversation-vue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import * as CONSTANT from '@/script/constant';
	import fs from '@/script/fs';
	import Tcp, * as TCP from './post/tcp';
	import voice_input from './voice_input';

	import Select from '@/pages/ui/select.vue';
	import Button from '@/pages/ui/button.vue';
	import Input from '@/pages/ui/input.vue';
	import AutoInput from '@/pages/ui/auto_input.vue';
	import Dialog from '@/pages/ui/dialog';
	// import Float_Buttons from '@/pages/ui/float_buttons.vue';
	import Picker from '@/pages/ui/picker';
	import Deck from '@/pages/deck/deck';
	import { toast } from '@/pages/toast/toast';

	import Duel from './scene/duel.vue';
	import RPS from './scene/rps.vue';
	import Avatar from './scene/avatar.vue';
	import Phase from './scene/phase.vue';
	import Plaid from './scene/plaid';
	import Client_Card from './scene/client_card';
	import Card_List from './card_list/cards.vue';
	import Chain_List from './card_list/chains.vue';
	import Group_Select_List from './select_list/group.vue';
	import Card_Select_List from './select_list/cards.vue';
	import Plaid_Select_List from './select_list/plaids.vue';
	import Pos_Select_List from './select_list/pos.vue';
	import Idles_Select_List from './select_list/idles.vue';
	import * as NETWORK from './post/network';
	import { Idle, EffectIdle } from './idle';

	let tcp : Tcp | null = null;
	const chat = ref<HTMLElement | null>(null);
	const info = ref<HTMLElement | null>(null);
	const float_buttons : Ref<{ dom: HTMLElement } | null> = ref(null);
	const select = ref<Array<HTMLElement> | null>(null);

	const page = reactive({
		server : false,
		wait : false,
		duel : false,
		win : false,
		loading : false,
		chat : {
			chk : false,
			ct : 0,
			shift : () => {
				page.chat.chk = !page.chat.chk;
			}
		},
		info : {
			chk : false,
			shift : () => {
				page.info.chk = !page.info.chk;
			}
		},
		click : (e : MouseEvent) => {
			const target = (e.target as HTMLElement);
			if (target.classList.contains('var-icon-close-circle')
				|| (float_buttons.value && float_buttons.value.dom.contains(e.target as HTMLElement))
				|| Array.from(document.getElementsByClassName('var-dialog')).findIndex(i => i.contains(target)) > -1
				|| server.voice_input.chk
			)
				return;
			if ((page.chat.chk && chat.value && !chat.value.contains(target))
				|| (page.info.chk && info.value && !info.value.contains(target)))
				page.chat.shift();
		},
		exit : async () : Promise<void> => {
			page.server = false;
			await mainGame.sleep(200);
			props.select.menu();
		},
		connect : async () : Promise<void> => {
			page.loading = true;
			if (await tcp?.connect(server.address ?? '', server.name ?? '', server.pass ?? '', connect)) {
				mainGame.push.system(CONSTANT.KEYS.SETTING_SERVER_ADDRESS, server.address);
				mainGame.push.system(CONSTANT.KEYS.SETTING_SERVER_PLAYER_NAME, server.name);
				mainGame.push.system(CONSTANT.KEYS.SETTING_SERVER_PASS, server.pass);
				fs.write.system();
			} else {
				page.loading = false;
			}
		},
		disconnect : async () : Promise<void> => {
			await tcp?.disconnect(connect);
		}
	});

	const connect = reactive({
		state : 0,
		is_host : false,
		self : -1,
		promise : undefined as (() => void) | undefined,
		chk_deck : undefined as ((value : string | boolean | PromiseLike<string | boolean>) => void) | undefined,
		deck : undefined as Deck | undefined,
		player : new Array(4).fill({ name : '' }) as Array<TCP.Player>,
		deck_count : [] as Array<number>,
		duel : {},
		phase : {
			player : -1,
			phase : -1,
			ep : false,
			bp : false,
			main : false,
			on : async (player : number, phase : number) : Promise<void> => {
				connect.phase.player = player;
				connect.phase.phase = phase;
				await mainGame.sleep(400);
			},
			clear : () : void => {
				connect.phase.player = -1;
				connect.phase.phase = -1;
				connect.phase.ep = false;
				connect.phase.bp = false;
				connect.phase.main = false;
			},
			select : async () : Promise<void> => {
				if (select.value !== null || tcp === null
					|| (tcp !== null && tcp.msg !== NETWORK.MSG.SELECT_BATTLECMD && tcp.msg !== NETWORK.MSG.SELECT_IDLECMD)
				)
					return;
				const arr : Array<[number, string]> = [];
				if (connect.phase.bp)
					arr.push([6, mainGame.get.text(I18N_KEYS.DUEL_PHASE_BATTLE)]);
				if (connect.phase.main)
					arr.push([2, mainGame.get.text(I18N_KEYS.DUEL_PHASE_MAIN2)]);
				if (connect.phase.ep)
					arr.push([3 + (tcp.msg - 10) * 4, mainGame.get.text(I18N_KEYS.DUEL_PHASE_END)]);
				if (arr.length === 0)
					return;
				const i = await Picker(
						[arr.map(i => { return { text : i[1] }; })],
						mainGame.get.text(I18N_KEYS.DUEL_PHASE_CHANGE),
						false
					);
				if (i !== undefined && tcp !== null) {
					connect.phase.ep = false;
					connect.phase.bp = false;
					connect.phase.main = false;
					await tcp?.send.response(arr[i[0]][0]);
				}
			}
		},
		cards : [] as Array<number>,
		chains : [] as Array<{ player : number; code : string | number; }>,
		select : {
			position : {
				title : '',
				code : 0,
				pos : 0,
				on : async (title : string,  code : number, pos : number) : Promise<void> => {
					connect.select.position.title = title;
					connect.select.position.code = code;
					connect.select.position.pos = pos;
				},
				select : async (result : number) : Promise<void> => {
					await tcp?.send.response(result);
					connect.select.position.clear();
				},
				clear : () : void => {
					connect.select.position.title = '';
					connect.select.position.code = 0;
					connect.select.position.pos = 0;
				}
			},
			group : {
				chk : false,
				title : '',
				min : 0,
				max : 0,
				cancelable : false,
				list : {
					unselected : [] as TCP.Select_Cards,
					selected : [] as TCP.Select_Cards
				},
				on : (title : string, unselected : TCP.Select_Cards, selected : TCP.Select_Cards, min : number, max : number, cancelable : boolean) : void => {
					connect.select.group.title = title;
					connect.select.group.min = min;
					connect.select.group.max = max;
					connect.select.group.list = {
						unselected : unselected,
						selected : selected
					};
					connect.select.group.cancelable = cancelable;
					connect.select.group.chk = true;
				},
				cancel : async () => {
					if (connect.select.group.cancelable)
						await tcp?.send.response(-1);
				},
				clear : () : void => {
					connect.select.group.list.unselected.forEach(i => i.card?.select.off());
					connect.select.group.list.selected.forEach(i => i.card?.select.off());
					connect.select.group.chk = false;
					connect.select.group.list.unselected.length = 0;
					connect.select.group.list.selected.length = 0;
					connect.select.group.cancelable = false;
					connect.select.group.title = '';
					connect.select.group.min = 0;
					connect.select.group.max = 0;
				}
			},
			cards : {
				show : true,
				title : '',
				min : 0,
				max : 0,
				cancelable : false,
				array : [] as TCP.Select_Cards,
				on : (title : string, array : TCP.Select_Cards, min : number, max : number, cancelable : boolean) : void => {
					connect.select.cards.title = title;
					connect.select.cards.min = min;
					connect.select.cards.max = max;
					connect.select.cards.array = array;
					connect.select.cards.cancelable = cancelable;
				},
				confirm : async (result : Array<number>) => {
					connect.select.cards.clear();
					await mainGame.sleep(200);
					await tcp?.send.response(result);
				},
				cancel : async (result : TCP.Select_Cards) => {
					connect.select.cards.cancelable ? await (async () => {
						await tcp?.send.response(-1);
						connect.select.cards.clear();
					})() : await (async () => {
						connect.select.cards.show = false;
						await mainGame.sleep(250);
						connect.select.cards.show = true;
						result.forEach(i => i.card?.select.on());
					})();
				},
				clear : () : void => {
					connect.select.cards.title = '';
					connect.select.cards.min = 0;
					connect.select.cards.max = 0;
					connect.select.cards.array.length = 0;
					connect.select.cards.cancelable = false;
				}
			},
			plaids : {
				show : true,
				title : '',
				min : 0,
				chk_player : undefined as undefined | number,
				pzone : false,
				array : [] as TCP.Plaids,
				on : (title : string, array : TCP.Plaids, place : number, ct : number) : void => {
					connect.select.plaids.title = title;
					connect.select.plaids.min = ct;
					connect.select.plaids.array = array;
					connect.select.plaids.chk_player = (place & 0x60) > 0 ? 0
						: (place & (0x60 << 16)) > 0 ? 1
							: undefined;
					connect.select.plaids.pzone = (place & 0xc000c000) > 0;
				},
				confirm : async (result : { loc : number, seq : number; player : number}) => {
					if (connect.select.plaids.chk_player !== undefined
						&& result.loc === NETWORK.LOCATION.MZONE
						&& [5, 6].includes(result.seq)
						&& result.player !== connect.select.plaids.chk_player
					)
						result = {
							player : connect.select.plaids.chk_player,
							loc : result.loc,
							seq : result.seq === 5 ? 6 : 5
						};
					else if (connect.select.plaids.pzone
						&& result.loc === NETWORK.LOCATION.SZONE
						&& [0, 4].includes(result.seq)
					)
						result.seq = result.seq === 0 ? 6 : 7;
					else if (result.loc === NETWORK.LOCATION.FZONE)
						result = {
							player : result.player,
							loc : NETWORK.LOCATION.SZONE,
							seq : 5
						};

					result.player = tcp?.to.player!(result.player);
					connect.select.plaids.clear();
					await mainGame.sleep(200);
					await tcp?.send.response(result);
				},
				cancel : async (cancelable : boolean, result : Array<Plaid>) => {
					cancelable ? await (async () => {
						await tcp?.send.response({
							player : tcp?.to.player!(0),
							loc : 0,
							seq : 0
						});
						connect.select.plaids.clear();
					})() : await (async () => {
						connect.select.plaids.show = false;
						await mainGame.sleep(250);
						connect.select.plaids.show = true;
						result.forEach(i => i.select.on());
					})();
				},
				clear : () : void => {
					connect.select.plaids.title = '';
					connect.select.plaids.min = 0;
					connect.select.plaids.array.length = 0;
					connect.select.plaids.chk_player = undefined;
					connect.select.plaids.pzone = false;
				}
			},
			option : {
				on : async (desc : Array<number>, title : number = 555, no_cancle : boolean = false) : Promise<number | undefined> => {
					const i = await Picker(
						[desc.map(i => { return { text : mainGame.get.desc(i) }; })],
						mainGame.get.strings.system(title),
						no_cancle
					);
					return i !== undefined && tcp !== null ? i[0] : undefined;
				}
			},
			idles : {
				title : '',
				code : '',
				cancelable : true,
				show : true,
				array : [] as TCP.Idles_Cards,
				push : (group : TCP.Idles_Cards, code : string, title : string = mainGame.get.strings.system(560), cancelable : boolean = false) : void => {
					connect.select.idles.title = title;
					connect.select.idles.cancelable = cancelable;
					connect.select.idles.code = code;
					connect.select.idles.array = group;
				},
				clear : () : void => {
					connect.select.idles.code = '';
					connect.select.idles.array.length = 0;
					connect.select.idles.cancelable = true;
					connect.select.idles.title = '';
					if (connect.promise)
						connect.promise();
				},
				cancel : async () => {
					if (connect.select.idles.cancelable) {
						await tcp?.send.response(-1);
						connect.select.idles.clear();
					} else {
						connect.select.idles.show = false;
						await mainGame.sleep(250);
						connect.select.idles.show = true;
					}
				},
				select : async (i : TCP.Idles_Card) : Promise<void> => {
					const card : Client_Card = i.card;
					let code;
					const key = connect.select.idles.code;
					connect.select.idles.clear();
					switch (key) {
						case 'summon':
							code = connect.idle.summon.array.indexOf(card) << 16;
							break;
						case 'spsummon':
							code = (connect.idle.spsummon.array.indexOf(card) << 16) + 1;
							break;
						case 'mset':
							code = (connect.idle.mset.array.indexOf(card) << 16) + 3;
							break;
						case 'sset':
							code = (connect.idle.sset.array.indexOf(card) << 16) + 4;
							break;
						case 'activate':
							const effects : Array<{
								card : Client_Card,
								desc : number
							}> = connect.idle.activate.array.filter(i => i.card === card && i.desc !== 1160);
							if (effects.length === 1) {
								code = connect.idle.activate.array.findIndex(i => i.card === card);
								if (tcp?.msg === NETWORK.MSG.SELECT_IDLECMD)
									code = (code << 16) + 5;
							} else {
								const i = await connect.select.option.on(effects.map(i => i.desc));
								if (i !== undefined)
									code = (connect.idle.activate.index(effects[i].card, effects[i].desc) << 16) + 5;
							}
							break;
						case 'scale':
							code = (connect.idle.activate.index(card, 1160) << 16) + 5;
							break;
					}
					if (code !== undefined)
						await connect.response(code);
				}
			},
			yes_no : async (title : string) : Promise<number> => {
				let result = 0;
				await Dialog({
					title : title,
					closeOnClickOverlay : false,
					onConfirm : () => {
						result ++;
					}
				});
				return result;
			}
		},
		lp : {
			ct : new Array(2).fill(0),
			change : (tp : number, lp : number) => {
				connect.lp.ct[tp] += lp;
			}
		},
		chat : {
			list : [] as TCP.Chats,
			send_list : [] as Array<string>,
			send_key : -1,
			send : async () : Promise<void> => {
				if (server.chat === '') return;
				connect.chat.send_list.push(server.chat);
				connect.chat.send_key = connect.chat.send_list.length;
				await tcp?.send.chat(server.chat);
				server.chat = '';
			},
			press : async (event : KeyboardEvent) : Promise<void> => {
				switch (event.key) {
					case 'Enter':
						await connect.chat.send();
						break;
					case 'ArrowUp':
						if (connect.chat.send_key > 0) {
							connect.chat.send_key --;
							server.chat = connect.chat.send_list[connect.chat.send_key] ?? '';
						}
						break;
					case 'ArrowDown':
						if (connect.chat.send_key < connect.chat.send_list.length - 1) {
							connect.chat.send_key ++;
							server.chat = connect.chat.send_list[connect.chat.send_key] ?? '';
						}
						break;
				}
			},
			clear : () : void => {
				connect.chat.send_key = connect.chat.send_list.length;
			},
			robot : async () : Promise<void> => {
				await tcp?.send.chat('/ai');
			}
		},
		home : {
			lflist : 0,
			rule : 0,
			mode : 0,
			duel_rule : 0,
			no_check_deck : false,
			no_shuffle_deck : false,
			start_lp : 0,
			start_hand : 0,
			draw_count : 0,
			time_limit : 0,
			watch : 0
		} as TCP.HostInfo,
		start : async () : Promise<void> => {
			if (connect.deck && connect.player.filter(i => i.ready).length === (connect.home.mode === 2 ? 4 : 2)) {
				page.loading = true;
				await tcp?.send.start();
			} else if (!connect.deck)
				toast.error(mainGame.get.text(I18N_KEYS.SERVER_DECK_ERROR))
			else
				toast.error(mainGame.get.text(I18N_KEYS.SERVER_PLAYER_ERROR))
		},
		ready : async (deck : Deck | undefined) : Promise<void> => {
			deck ? await (async () => {
				if (connect.player[connect.self]?.ready)
					await tcp?.send.un_ready();
				await tcp?.send.ready(deck);
			})() : await tcp?.send.un_ready();
		},
		rule : async (deck : Deck | undefined) : Promise<string | boolean> => {
			if (deck) {
				const promise_deck = new Promise<string | boolean>((resolve) => {
					connect.chk_deck = resolve;
				});
				const result = await promise_deck;
				await mainGame.sleep(100);
				connect.chk_deck = undefined;
				return result;
			} else {
				return true;
			}
		},
		kick : async (v : number) : Promise<void> => {
			if (connect.self !== v)
				await tcp?.send.kick(v);
		},
		to : {
			duelist : async () : Promise<void> => {
				if (connect.self >= 4 || connect.home.mode === 2) {
					await tcp?.send.to_duelist();
				}
			},
			watcher : async () : Promise<void> => {
				if (connect.self < 4) {
					await tcp?.send.to_watcher();
				}
			},
		},
		rps : {
			chk : false,
			result : [0, 0],
			select : async (v : number) : Promise<void> => {
				await tcp?.send.rps(v);
			},
			off : () : void => {
				connect.rps.chk = false;
			},
		},
		is_first : {
			chk : undefined as boolean | undefined,
			selecting : false,
			on : () => {
				connect.is_first.selecting = true;
			},
			select : async (v : number) : Promise<void> => {
				await tcp?.send.select_tp(v);
				connect.is_first.chk = v === 1;
				connect.is_first.selecting = false;
			},
		},
		time : {
			this : [0, 0],
			palyer : -1,
			to : (tp : number, time : number) : void => {
				tp > -1 ? connect.time.this[tp] = time * 1000
					: connect.time.this = new Array(2).fill(connect.home.time_limit * 1000);
				connect.time.palyer = tp ;
			}
		},
		idle : {
			summon : new Idle(),
			spsummon : new Idle(),
			activate : new EffectIdle(),
			mset : new Idle(),
			sset : new Idle(),
			attack : new Idle(),
			repos : new Idle()
		},
		response : async (v : number) : Promise<void> => {
			await tcp?.send.response(v);
		},
		surrender : async () : Promise<void> => {
			await Dialog({
				title : mainGame.get.text(I18N_KEYS.SERVER_SURRENDER),
				onConfirm : tcp?.send.surrender
			});
		},
		win : async (title : string, message : string) : Promise<void> => {
			await Dialog({
				title : title,
				message : message,
				cancelButton : false
			});
		},
		clear : () => {
			connect.is_first.selecting = false;
			connect.select.cards.clear();
			connect.select.plaids.clear();
			connect.select.position.clear();
			connect.player = new Array(4).fill({ name : '' }) as Array<TCP.Player>;
			connect.home = {
				lflist : 0,
				rule : 0,
				mode : 0,
				duel_rule : 0,
				no_check_deck : false,
				no_shuffle_deck : false,
				start_lp : 0,
				start_hand : 0,
				draw_count : 0,
				time_limit : 0,
				watch : 0
			};
			connect.deck = undefined;
			connect.chat.list.length = 0;
			connect.deck_count.length = 0;
			connect.cards.length = 0;
			connect.chains.length = 0;
			connect.is_first.chk = undefined;
			connect.chat.send_list.length = 0;
			connect.chat.send_key = -1;
			connect.phase.clear();
			connect.duel = {};
			for (const i of Object.values(connect.idle))
				i.clear();
		}
	});

	const server = reactive({
		chat : '',
		name : mainGame.get.system(CONSTANT.KEYS.SETTING_SERVER_PLAYER_NAME) as string,
		address : mainGame.get.system(CONSTANT.KEYS.SETTING_SERVER_ADDRESS) as string,
		pass : mainGame.get.system(CONSTANT.KEYS.SETTING_SERVER_PASS) as string,
		options : computed(() => {
			return Array.from(mainGame.servers).map(([k, v]) => ({ label: k, value: v }));
		}),
		voice_input : {
			chk : false,
			shift : () : void => {
				server.voice_input.chk = !server.voice_input.chk;
			},
			result : async (str : string) : Promise<void> => {
				await Dialog({
					title : str,
					closeOnClickOverlay : false,
					onConfirm : () => {
						server.chat += str;
						server.voice_input.chk = false;
					}
				});
			},
		}
	});

	onBeforeMount(async () => {
		tcp = new Tcp();
		await tcp.listen(connect);
		voice_input.result(await server.voice_input.result);
	});

	onMounted(() => {
		page.server = true;
		document.addEventListener('click', page.click);
	});

	onUnmounted(() => {
		document.removeEventListener('click', page.click);
	});

	watch(() => {return page.chat.chk}, (n) => {
		n ? toast.off() : toast.on();
	});

	watch(() => { return server.voice_input.chk; }, (n) => {
		if (voice_input.chk())
			n ? voice_input.start() : voice_input.stop();
	});

	watch(() => { return connect.home.time_limit; }, (n) => {
		connect.time.this = new Array(2).fill(n * 1000);
	});

	watch(() => { return connect.state; }, async (n) => {
		if (![0, 1, 2].includes(n)) return;
		const on = async () => {
			page.server = false;
			await mainGame.sleep(200);
			page.wait = true;
			page.loading = false;
		};
		const start = async () => {
			page.wait = false;
			await mainGame.sleep(200, mainGame.load.pic, [connect.deck ?? []]);
			page.duel = true;
			page.loading = false;
		};
		const off = async () => {
			page.wait = false;
			page.duel = false;
			page.chat.chk = false;
			await mainGame.sleep(200);
			page.server = true;
			connect.clear();
			page.loading = false;
			page.chat.chk = false;
			server.chat = '';
		};
		await [off, on, start][n]();
	});

	watch(() => { return page.chat.chk; }, (n : boolean) => {
		if (n && chat.value !== null) {
			const el : HTMLElement = chat.value.querySelector('.message')!;
			el.scrollTop = el.scrollHeight;
		}
	});

	watch(() => { return chat.value; }, (n : HTMLElement | null) => {
		if (n) {
			const el : HTMLElement = n.querySelector('.message')!;
			el.scrollTop = el.scrollHeight;
		}
	});

	const props = defineProps(['select']);
</script>
<style scoped lang = 'scss'>
	@use './server.scss';
</style>