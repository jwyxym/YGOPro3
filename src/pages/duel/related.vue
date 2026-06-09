<template>
	<div class = 'related-cards' v-if = 'show' @click.self = 'close'>
		<div class = 'content'>
			<div class = 'header'>
				<span>「{{ targetCard?.name }}」的相關卡片</span>
				<Button icon_name = 'collapse' @click = 'close'/>
			</div>
			<div class = 'list no-scrollbar' v-if="!loading">
				<div v-for = 'card in cards' :key = 'card.id' class = 'card-item' @click = "emit('card', card.id)">
					<img :src = 'card.pic'/>
					<span>{{ card.name }}</span>
				</div>
			</div>
			<div v-else style="display: flex; justify-content: center; align-items: center; height: 100%;">
				Loading...
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { ref, watch } from 'vue';
	import mainGame from '@/script/game';
	import Card from '@/script/card';
	import Search from '@/pages/deck/search';
	import Button from '@/pages/ui/button.vue';

	const props = defineProps<{
		show: boolean;
		cardId?: number;
	}>();

	const emit = defineEmits<{
		'update:show': [value: boolean];
		'card': [cardId: number];
	}>();

	const cards = ref<Array<Card>>([]);
	const loading = ref(false);
	const targetCard = ref<Card | null>(null);

	const close = () => {
		emit('update:show', false);
	};

	watch(() => props.show, async (n) => {
		if (n && props.cardId) {
			targetCard.value = mainGame.get.card(props.cardId);
			if (targetCard.value && targetCard.value !== mainGame.unknown) {
				loading.value = true;
				cards.value = await Search.about(props.cardId);
				const ids = cards.value.map(c => c.id);
				await mainGame.load.pic(ids);
				loading.value = false;
			}
		} else {
			cards.value = [];
		}
	});
</script>
<style scoped lang = 'scss'>
	.related-cards {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		
		.content {
			width: 80%;
			height: 80%;
			background: rgba(0, 0, 0, 0.85);
			border: 1px solid white;
			border-radius: 8px;
			display: flex;
			flex-direction: column;
			
			.header {
				padding: 10px 20px;
				display: flex;
				justify-content: space-between;
				align-items: center;
				border-bottom: 1px solid white;
				font-size: 1.2rem;
				font-weight: bold;
			}
			
			.list {
				flex: 1;
				overflow-y: auto;
				padding: 20px;
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
				gap: 15px;
				
				.card-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					cursor: pointer;
					
					img {
						width: 100%;
						object-fit: contain;
						transition: transform 0.2s;
						
						&:hover {
							transform: scale(1.05);
						}
					}
					
					span {
						margin-top: 5px;
						font-size: 0.9rem;
						text-align: center;
						word-break: break-all;
					}
				}
			}
		}
	}
</style>
