<template>
	<transition name = 'move_left'>
		<var-swipe :autoplay = '2000' class = 'swipe' v-show = 'page.show'>
			<var-swipe-item v-for = 'i in page.swipe' @click = 'page.open(i.url)'>
				<div>
					<img :src = 'i.image'/>
					<span>{{ i.title }}</span>
				</div>
			</var-swipe-item>
		</var-swipe>
	</transition>
</template>
<script setup lang = 'ts'>
	import { onMounted, reactive } from 'vue';
	import * as Opener from '@tauri-apps/plugin-opener';

	import { URL } from '@/script/constant';
	import fs from '@/script/fs';
	import http from '@/script/tauri-api/http';
	import { toast } from '@/pages/toast/toast';

	interface swipe {
		url : string;
		image : string;
		title : string;
		updated_at : string;
	};

	const page = reactive({
		show : false,
		swipe : [] as Array<swipe>,
		open : async (url : string) => {
			try {
				await Opener.openUrl(url);
				return true;
			} catch (e) {
				toast.error(e);
				fs.write.log(e);
			}
		}
	});

	onMounted(async () => {
		if (!import.meta.env.DEV) {
			const data = await http.get<Array<{
				id : string;
				news : {
					['zh-CN'] : Array<swipe>;
				};
			}>>(URL.MYCARD_NEWS);
			if (data) {
				const news = data.filter(i => i.id === 'ygopro' && i.news);
				if (news.length > 0)
					page.swipe = news[0].news['zh-CN'].slice(0, 8);
			}
		}
		page.show = true;
	});
</script>
<style scoped lang = 'scss'>
	.swipe {
		overflow: hidden;
		width: 100%;
		height: 50%;
		div {
			width: 100%;
			height: 100%;
			color: white;
			position: relative;
			background: rgba(255, 255, 255, 0.01);
			backdrop-filter: blur(10px);
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
			img {
				position: absolute;
				object-fit: cover;
				width: 100%;
				height: 80%;
			}
			span {
				position: absolute;
				max-width: 100%;
				bottom: 5%;
				-webkit-text-stroke: 1px black;
			}
			&:hover {
				cursor: pointer;
			}
		}
	}

	.move_left {
		&-enter-active,
		&-leave-active {
			transition: transform 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translateX(-var(--width));
		}

		&-enter-to,
		&-leave-from {
			transform: initial;
		}
	}
</style>