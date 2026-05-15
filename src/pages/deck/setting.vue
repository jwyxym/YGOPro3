<template>
	<div
		class = 'setting'
		:style = "{ '--width' : `${width}px`, '--height' : `${height}px` }"
	>
		<Input
			:placeholder = 'mainGame.get.text(I18N_KEYS.DECK_NAME)'
			:rules = 'setting.name_rule'
			variant = 'outlined'
			v-model = 'setting.name'
		/>
		<var-menu
			:close-on-click-reference = 'true'
			placement = 'bottom'
		>
			<var-button
				text outline container
			>
				<var-icon name = 'menu'/>
			</var-button>
			<template #menu>
				<var-cell
					ripple
					v-for = 'i in setting.btns'
					@click = '(i.func as ListenerProp<(e: Event) => void>)'
				>
					{{ mainGame.get.text(i.key) }}
				</var-cell>
			</template>
		</var-menu>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, watch } from 'vue';
	import { ListenerProp } from '@varlet/ui';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { REG } from '@/script/constant';

	import { toast } from '@/pages/toast/toast';

	import Input from '@/pages/ui/input.vue';

	import Deck from './deck';

	const setting = reactive({
		name : '',
		btns : [
			{ key : I18N_KEYS.DECK_SETTING_SAVE, func : async () => {
				const rule = await setting.name_rule(setting.name);
				typeof rule == 'boolean' ? emit('save', setting.name) : toast.error(rule);
			} },
			{ key : I18N_KEYS.DECK_SETTING_SHARE, func : async () => {
				const rule = await setting.name_rule(setting.name);
				typeof rule == 'boolean' ? emit('share', setting.name) : toast.error(rule);
			} },
			{ key : I18N_KEYS.DECK_SETTING_SORT, func : () => emit('sort') },
			{ key : I18N_KEYS.DECK_SETTING_DISRUPT, func : () => emit('disrupt') },
			{ key : I18N_KEYS.DECK_SETTING_CLEAR, func : () => emit('clear') },
		] as Array<{ key : number; func : Function; }>,
		name_rule : async (name ?: string) : Promise<string | boolean> => {
			if (name === undefined || name.length === 0)
				return mainGame.get.text(I18N_KEYS.RULE_NAME_LEN);
			if (name.match(REG.NAME))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
			if ((await mainGame.load.deck()).filter(i => i.name === name).length > (props.deck.new || (props.deck.name!.length > 0 && props.deck.name !== name) ? 0 : 1))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_EXIST);
			return true;
		}
	});

	const emit = defineEmits<{
		save : [name : string];
		share : [name : string];
		sort : [];
		disrupt : [];
		clear : [];
	}>();

	const props = defineProps<{
		width : number;
		height : number;
		deck : Deck;
	}>();

	watch(() => props.deck.name, (n) => setting.name = n ?? '', { immediate : true });
</script>
<style lang = 'scss' scoped>
	.setting {
		width: var(--width);
		height: var(--height);
		display: flex;
		gap: 10px;
		.var-input {
			width: 80%;
			height: 70px;
			align-self: center;
		}
		.var-menu {
			transform: translateY(3px);
		}
	}
</style>