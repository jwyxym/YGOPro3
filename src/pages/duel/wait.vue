<template>
	<div class = 'wait'>
		<div><b>{{ info.room_name }}</b></div>
		<div>
			<div>
				<div>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.SERVER_TO_DUELIST)'
						:class = "{ 'readonly' : self.position < 4 && info.mode !== 2 }"
						@click = "emit('duelist')"
					></Button>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.SERVER_TO_WATCHER)'
						:class = "{ 'readonly' : self.position >= 4 }"
						@click = "emit('watcher')"
					></Button>
					{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_WATCH)} : ${info.watch}` }}
				</div>
				<div>
					<div v-for = '(i, v) in player.slice(0, info.mode === 2 ? 4 : 2)'>
						<div><span>{{ i.name }}</span></div>
						<div>
							<var-checkbox
								class = 'readonly'
								:readonly = 'true'
								v-model = 'i.status'
							></var-checkbox>
							<var-icon
								v-if = 'self.is_host'
								:color = "self.position === v ? '#555' : 'white'"
								name = 'close-circle-outline'
								@click = "emit('kick', v as 0 | 1 | 2 | 3)"
							/>
						</div>
					</div>
				</div>
			</div>
			<div>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_LFLIST)} : ${mainGame.get.lflist(info.lflist).name}` }}</span>
				<span>
					{{
						`${mainGame.get.text(I18N_KEYS.SERVER_HOME_RULE)} : ${mainGame.get.text([
							I18N_KEYS.SERVER_RULE_OCG, I18N_KEYS.SERVER_RULE_TCG, I18N_KEYS.SERVER_RULE_SC, I18N_KEYS.SERVER_RULE_CUSTOM, I18N_KEYS.SERVER_RULE_NO_EXCLUSIVE, I18N_KEYS.SERVER_RULE_ALL
						][info.rule] ?? I18N_KEYS.UNKNOW)}`
					}}
				</span>
				<span>
					{{
						`${mainGame.get.text(I18N_KEYS.SERVER_HOME_MODE)} : ${mainGame.get.text([
							I18N_KEYS.SERVER_MODE_SINGLE, I18N_KEYS.SERVER_MODE_MATCH, I18N_KEYS.SERVER_MODE_TAG
						][info.mode] ?? I18N_KEYS.UNKNOW)}`
					}}
				</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_TIME_LIMIT)} : ${info.time_limit}` }}</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_START_LP)} : ${info.start_lp}` }}</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_START_HAND)} : ${info.start_hand}` }}</span>
				<span>{{ `${mainGame.get.text(I18N_KEYS.SERVER_HOME_DRAW_COUNT)} : ${info.draw_count}` }}</span>
				<span v-show = 'info.no_check_deck'>{{ mainGame.get.text(I18N_KEYS.SERVER_NO_CHECK_DECK) }}</span>
				<span v-show = 'info.no_shuffle_deck'>{{ mainGame.get.text(I18N_KEYS.SERVER_NO_SHUFFLE_DECK) }}</span>
			</div>
		</div>
		<div>
			<Select
				name = 'deck'
				v-model = 'page.deck'
				@change = "(deck : Deck | undefined) => emit('deck', deck)"
				:rules = 'page.rules'
			/>
			<div>
				<Button
					v-if = 'self.is_host'
					:content = 'mainGame.get.text(I18N_KEYS.SERVER_CONNECT)'
					@click = "emit('connect')"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang = 'ts'>
	import { reactive } from 'vue'
	import Button from '@/pages/ui/button.vue';
	import Select from '@/pages/ui/select.vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Deck from '@/pages/deck/deck';

	const props  = defineProps<{
		player : Array<{
			name : string;
			status : boolean;
		}>;
		self : {
			is_host : boolean;
			position : 0 | 1 | 2 | 3;
			deck : true | string
		};
		info : {
			room_name : string;
			lflist : number;
			rule : number;
			mode : number;
			duel_rule : number;
			no_check_deck : boolean;
			no_shuffle_deck : boolean;
			start_lp : number;
			start_hand : number;
			draw_count : number;
			time_limit : number;
			watch : number;
		}
	}>();

	const emit = defineEmits<{
		kick : [v : 0 | 1 | 2 | 3];
		deck : [deck ?: Deck];
		duelist : [];
		watcher : [];
		connect : [];
		disconnect : [];
	}>();

	const page = reactive({
		deck : undefined as undefined | Deck,
		rules : () => props.self.deck
	});
</script>

<style scoped lang = 'scss'>
	.wait {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 400px;
		width: 800px;
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.2);
		color: white;
		> div {
			width: calc(100% - 40px);
		}
		> div:first-child {
			height: 50px;
			display: flex;
			justify-content: center;
			align-items: center;
		}
		> div:nth-child(2) {
			height: calc(100% - 130px);
			display: flex;
			> div {
				height: 100%;
				width: 70%;
				display: flex;
				flex-direction: column;
				> div:first-child {
					width: 100%;
					height: 50px;
					margin-left: 10px;
					display: flex;
					gap: 10px;
					align-items: center;
				}
				> div:last-child {
					width: 100%;
					height: calc(100% - 50px);
					> div {
						display: flex;
						border-bottom: 1px solid white;
						align-items: center;
						height: 23%;
						> div:first-child {
							width: calc(100% - 60px);
							> span {
								margin-left: 10px;
							}
						}
						> div:last-child {
							width: 60px;
							display: flex;
							align-items: center;
						}
					}
				}
			}
			> div:last-child {
				height: 100%;
				width: 30%;
				margin-left: 20px;
			}
		}
		> div:last-child {
			width: 80%;
			height: 80px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			> div {
				width: 40%;
			}
		}

	}
</style>