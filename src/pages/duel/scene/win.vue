<template>
	<var-dialog
		v-model:show = 'page.show'
		confirm-button-text-color = 'white'
		cancel-button-text-color = 'white'
		:cancel-button = 'page.chk ? true : !page.replay'
		:confirm-button = 'page.chk ? !page.replay : true'
		:confirm-button-text = 'page.chk ? page.text.cancel : page.text.confirm'
		:cancel-button-text = 'page.chk ? page.text.confirm : page.text.cancel'
		:close-on-click-overlay = 'false'
		:close-on-key-escape = 'false'
		@open = 'page.reset'
		@confirm = '() => page.chk ? page.cancel() : page.confirm()'
		@cancel = '() => page.chk ? page.confirm() : page.cancel()'
	>
		<template #title>
			{{ page.text.title }}
		</template>
		<div :class = "{ 'ygopro3__duel__win' : !page.replay }">
			<p>
				{{ page.text.message }}
			</p>
			<Input
				v-if = '!page.replay'
				ref = 'input'
				variant = 'outlined'
				:placeholder = 'mainGame.get.text(I18N_KEYS.REPLAY_NAME)'
				v-model = 'page.name'
				:rules = 'page.rule'
			/>
		</div>
	</var-dialog>
</template>
<script setup lang = 'ts'>
	import { computed, onBeforeMount, reactive } from 'vue';

	import mainGame from '@/script/game';
	import { KEYS, REG } from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import invoke from '@/script/invoke';

	import Input from '@/pages/ui/input.vue';

	const page = reactive({
		show : computed({
			get : () => props.show,
			set : (v : boolean) => emit('update:show', v)
		}),
		name : '',
		chk : false,
		replay : false,
		text : {
			title : '',
			message : '',
			cancel : '',
			confirm : ''
		},
		confirm : async () => await page.rule(page.name) === true
			&& !props.replay
			? emit('confirm', page.name + '.yrp3d')
			: page.cancel(),
		cancel : () => emit('cancel'),
		rule : async (name ?: string) : Promise<string | true> => {
			if (name === undefined || name.length === 0)
				return mainGame.get.text(I18N_KEYS.RULE_NAME_LEN);
			if (name.match(REG.NAME))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
			if ((await invoke.replay.list()).find(i => i === name))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_EXIST);
			return true;
		},
		reset : () => {
			page.text.title = props.title;
			page.text.message = props.message;
			page.replay = props.replay;
			page.chk = mainGame.get.system(KEYS.SETTING_CHK_SWAP_BUTTON) as boolean;
			page.text.confirm = mainGame.get.text(props.replay
				? I18N_KEYS.CONFIRM
				: I18N_KEYS.DUEL_SAVE_REPLAY
			);
			page.text.cancel = mainGame.get.text(I18N_KEYS.CANCEL);
		}
	});

	onBeforeMount(() => {
		const now = new Date();
		const year = now.getFullYear().toString();
		const month = (now.getMonth() + 1).toString();
		const day = now.getDate().toString();
		const hour = now.getHours().toString();
		const minute = now.getMinutes().toString();
		const second = now.getSeconds().toString();
		page.name = [
			`${year.length > 1 ? '' : '0'}${year}`,
			`${month.length > 1 ? '' : '0'}${month}`,
			`${day.length > 1 ? '' : '0'}${day}`,
			`${hour.length > 1 ? '' : '0'}${hour}`,
			`${minute.length > 1 ? '' : '0'}${minute}`,
			`${second.length > 1 ? '' : '0'}${second}`
		].join('-');
	});

	const props = defineProps<{
		show : boolean;
		replay : boolean;
		title : string;
		message : string;
	}>();

	const emit = defineEmits<{
		'update:show' : [v : boolean],
		confirm : [name : string],
		cancel : []
	}>();
</script>
<style scoped lang = 'scss'>
	.ygopro3__duel__win {
		height: 100px;
	}
</style>