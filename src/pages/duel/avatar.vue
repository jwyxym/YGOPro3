<template>
	<div
		class = 'avatar'
		:class = "{
			'avatar__oppo' : index,
			'avatar__self' : !index
		}"
		@mouseenter = 'page.desc = true'
		@mouseleave = 'page.desc = false'
		@touchstart = 'page.desc = true'
		@touchend = 'page.desc = false'
	>
		<var-avatar
			:src = 'mainGame.get.avatar(index)'
			:bordered = 'true'
			:border-color = "index ? 'red' : 'blue'"
		/>
		<div>
			<strong>{{ name }}</strong>
			<div>
				<div>
					<strong>{{ mainGame.get.text(I18N_KEYS.DUEL_LP) }}</strong>
					<span>:</span>
					<var-count-to
						:from = 'lp.from'
						:to = 'lp.to'
						:duration = '300'
					/>
				</div>
				<div>
					<strong>{{ mainGame.get.text(I18N_KEYS.DUEL_TIME) }}</strong>
					<span>:</span>
					<var-countdown
						:auto-start = 'false'
						:time = 'time'
						format = 'ss'
						ref = 'countdown'
					/>
				</div>
			</div>
		</div>
		<strong
			:class = "{
				'damage__show' : lp.show,
				'damage__move' : lp.move
			}"
			:style = "{
				'--color' : lp.damage.startsWith('-') ? 'red' : 'rgb(4, 255, 4)'
			}"
		>
			{{ lp.damage }}
		</strong>
		<transition name = 'opacity'>
			<div v-show = 'page.desc'>
				<span
					v-for = 'i in desc'
				>
					*&nbsp;{{ mainGame.get.desc(i) }}
				</span>
			</div>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, watch, ref } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';

	interface VarCountdown extends HTMLElement {
		start : Function;
		pause : Function;
	};

	const countdown = ref<VarCountdown | null>(null);
	const lp = reactive({
		from : 0,
		to : 0,
		damage : '',
		show : false,
		move : false
	});

	const page = reactive({
		desc : false
	});

	const props = defineProps<{
		lp : number;
		name : string;
		time : number;
		time_player : 0 | 1;
		index : 0 | 1;
		desc : Array<number>
	}>();

	watch(() => { return props.lp; }, async (n) => {
		const damage = n - lp.to;
		lp.move = !!damage;
		lp.damage = damage.toString();
		if (lp.move) {
			await mainGame.sleep(150);
			lp.show = lp.move;
			await mainGame.sleep(150);
			lp.move = false;
			await mainGame.sleep(150);
			lp.show = false;
			await mainGame.sleep(150);
		}
		lp.damage = '';
		lp.from = lp.to;
		lp.to = n;
	}, { immediate : true });

	watch(() => { return props.time_player; }, (n) => {
		if (!countdown.value) return;
		props.index === n ? countdown.value.start() : countdown.value.pause();
	}, { immediate : true });

</script>
<style scoped lang = 'scss'>
	.avatar {
		color: white;
		display: flex;
		gap: 10px;
		width: 250px;
		height: 60px;
		z-index: 10;
		.var-avatar {
			transform: translateY(5px);
			width: 50px;
			height: 50px;
		}
		> div:nth-child(2) {
			width: calc(100% - 50px);
			height: 100%;
			white-space: nowrap;
			display: flex;
			gap: 10px;
			--count-to-text-color: white !important;
			--countdown-text-color: white !important;
			> div {
				height: 100%;
				width: 100%;
				display: flex;
				flex-direction: column;
				> div {
					width: 100%;
					height: 50%;
					display: flex;
					justify-content: center;
					gap: 3px;
				}
			}
		}
		> strong {
			font-size: 24px;
			position: absolute;
			left: 0;
			top: 0;
			opacity: 0;
			color: var(--color);
			transition: all 0.15s ease;
		}
		> div:last-child {
			position: absolute;
			display: flex;
			flex-direction: column;
		}
	}
	.avatar__self {
		bottom: 10px;
		left: 10px;
		background: linear-gradient(to right, blue, transparent);
		> strong {
			transform: translate(160px, 0);
		}
		.damage__move {
			transform: translate(160px, -60px) !important;
		}
		> div:last-child {
			bottom: calc(100% + 10px);
		}
	}
	.avatar__oppo {
		top: 10px;
		right: 10px;
		background: linear-gradient(to left, red, transparent);
		flex-direction: row-reverse;
		.text{
			display: flex;
			justify-content: right;
		}
		> strong {
			transform: translate(100px, 30px);
		}
		.damage__move {
			transform: translate(100px, 60px) !important;
		}
		> div:nth-child(2) {
			flex-direction: row-reverse;
		}
		> div:last-child {
			top: calc(100% + 10px);
		}
	}
	.damage__show {
		opacity: 1 !important;
	}
	.opacity {
		&-enter-active,
		&-leave-active {
			transition: opacity 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			opacity: 0;
		}

		&-enter-to,
		&-leave-from {
			opacity: 1;
		}
	}
</style>
