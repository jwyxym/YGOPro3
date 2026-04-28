<template>
	<TransitionGroup class = 'chain no-scrollbar' tag = 'div' name = 'move_up'>
		<div
			v-for = '(i, v) in cards'
			:key = 'v'
			:style = "{ '--color' : i.owner ? 'red' : 'blue' }"
			:id = 'i.id.toString()'
			@click.stop = "emit('click', i);"
			ref = 'el'
		>
			{{ mainGame.get.text(I18N_KEYS.DUEL_CHAIN) }} : {{ v }}
			<img :src = 'mainGame.get.card(i.id).pic'/>
		</div>
	</TransitionGroup>
</template>
<script setup lang = 'ts'>
	import { ref, watch } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import Client_Card from './client_card';
	const el = ref<HTMLElement | null>(null);

	const props  = defineProps<{
		cards : Array<Client_Card>
	}>();

	watch(() => el.value, () => {
		if (!el.value)
			return;
		const { scrollTop, scrollHeight, clientHeight } = el.value;
		if (scrollTop + clientHeight > scrollHeight - 80)
			el.value.scrollTop = scrollHeight;
	});

	const emit = defineEmits<{
		click : [card : Client_Card];
	}>();
</script>
<style scoped lang = 'scss'>
	.chain {
		border: 1px white solid;
		background-color: rgba(0, 0, 0, 0.5);
		color: white;
		position: fixed;
		right: 0;
		top: 50%;
		width: 150px;
		height: calc(var(--height) * 0.9);
		transform: translate(calc(var(--left) / var(--scale) - 10px), -50%);
		overflow-y: auto;
		scroll-behavior: smooth;
		pointer-events: none;
		> div {
			width: 100%;
			height: 130px;
			background: linear-gradient(to right, var(--color), transparent);
			display: flex;
			flex-direction: column;
			> img {
				align-self: center;
				width: 70px;
				pointer-events: initial;
			}
		}
	}
	.move_up {
		&-enter-active,
		&-leave-active {
			transition: transform 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translateY(var(--height));
		}

		&-enter-to,
		&-leave-from {
			transform: translateY(0%);
		}
	}
</style>