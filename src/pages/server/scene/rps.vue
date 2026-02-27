<template>
	<div class = 'rps' ref = 'rps'>
		<TransitionGroup tag = 'div' name = 'scale' class = 'pics'
			:style = "{ '--y' : `${page.height}px` }"
		>
			<img
				v-for = "(i, v) in CONSTANT.FILES.TEXTURE_RPS.map(i => mainGame.get.textures(i) as string | undefined ?? '')"
				v-if = 'page.show'
				:key = 'i'
				:src = 'i'
				@click = 'page.on(v)'
			/>
		</TransitionGroup>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onMounted, onUnmounted, reactive, TransitionGroup, watch } from 'vue';

	import * as CONSTANT from '@/script/constant';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { toast } from '@/pages/toast/toast';

	const page = reactive({
		height : 0,
		width : 0,
		show : false,
		resize : () => {
			page.height = window.innerHeight - window.innerHeight * 0.25;
		},
		on : async (v : number) : Promise<void> => {
			page.show = false;
			await props.connect.rps.select(v);
		}
	});

	onBeforeMount(() => {
		window.addEventListener('resize', page.resize);
	});

	onMounted(() => {
		page.resize();
		page.show = true;
	});

	onUnmounted(() => {
		window.removeEventListener('resize', page.resize);
	});

	const props = defineProps(['connect']);

	watch(() => { return props.connect.rps.result; }, (n) => {
		if (n[0] === n[1]) {
			page.show = true;
			toast.info(mainGame.get.text(I18N_KEYS.SERVER_RPS_BYE));
		} else {
			if (n[0] === n[1] + 1 || n[0] === n[1] - 2) {
				toast.info(mainGame.get.text(I18N_KEYS.SERVER_RPS_WIN));
				props.connect.is_first.on();
			} else
				toast.info(mainGame.get.text(I18N_KEYS.SERVER_RPS_LOSE));
			props.connect.rps.off();
		}
	}, { deep : true });

</script>
<style scoped lang = 'scss'>
	.rps {
		position: relative;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		.pics {
			display: flex;
			gap: 30px;
			margin: 0 auto;
			transform: translateY(var(--y));
			width: calc(30vh + 90px);
		}
		img {
			width: 10vh;
			height: 10vh;
			&:hover {
				cursor: pointer;
			}
		}
	}
</style>