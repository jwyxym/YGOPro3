<template>
	<div
		class = 'avatar'
		:class = "{
			'avatar__oppo' : index,
			'avatar__self' : !index
		}"
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
					<strong>LP</strong>
					<span>:</span>
					<var-count-to
						:from = 'page.lp.from'
						:to = 'page.lp.to'
						:duration = '300'
					/>
				</div>
				<div>
					<strong>Time</strong>
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
		<strong :class = "{
			'damage__show' : page.lp.show,
			'damage__move' : page.lp.move 
		}">{{ page.lp.damage }}</strong>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive, watch, ref } from 'vue';
	import mainGame from '@/script/game';

	interface VarCountdown extends HTMLElement {
		start : Function;
		pause : Function;
	}

	const countdown = ref<VarCountdown | null>(null);
	const page = reactive({
		lp : {
			from : 0,
			to : 0,
			damage : '',
			show : false,
			move : false,
		}
	});

	const props = defineProps<{
		lp : number;
		name : string;
		time : number;
		time_player : 0 | 1;
		index : 0 | 1;
	}>();

	watch(() => { return props.lp; }, async (n) => {
		const damage = n - page.lp.to;
		page.lp.move = !!damage;
		page.lp.damage = damage.toString();
		if (page.lp.move) {
			await mainGame.sleep(150);
			page.lp.show = page.lp.move;
			await mainGame.sleep(150);
			page.lp.move = false;
			await mainGame.sleep(150);
			page.lp.show = false;
			await mainGame.sleep(150);
		}
		page.lp.damage = '';
		page.lp.from = page.lp.to;
		page.lp.to = n;
	}, { immediate : true });

	watch(() => { return props.time_player; }, (n) => {
		if (!countdown.value) return;
		props.index === n ? countdown.value.start() : countdown.value.pause();
	}, { immediate : true });

</script>
<style scoped lang = 'scss'>
	.avatar {
		color: white;
		pointer-events: none;
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
			transition: all 0.15s ease;
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
	}
	.damage__show {
		opacity: 1 !important;
	}
</style>
