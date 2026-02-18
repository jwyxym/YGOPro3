<template>
<div class="waitting-background">
	<div class="waitting-title">XX的决斗房间</div>
    <div class="waitting-text">
		<div class="waitting-information">
			<div class="waitting-player-background">
				<div class="waitting-player-team">→决斗者</div>
				<div v-for="(name, index) in props.name.slice(0, 4)" :key="index" class="waitting-player-name">
					<span class="waitting-player-logo">X</span>
					<div>{{ name }}</div>
					<var-checkbox readonly v-model="value" class="waitting-player-checkbox" />
				</div>
			</div>
			<div class="waitting-rules-background">
				<div class="waitting-rules-text">
					<div>禁限卡表：</div>
					<div>???</div>
				</div>
				<div class="waitting-rules-text">
					<div>卡片允许：</div>
					<div>所有卡片</div>
				</div>
				<div class="waitting-rules-text">
					<div>决斗模式：</div>
					<div>单局模式</div>
				</div>
				<div class="waitting-rules-text">
					<div>每回合时间：</div>
					<div>6000</div>
				</div>
				<div class="waitting-rules-text">
					<div>初始基本分：</div>
					<div>8000</div>
				</div>
				<div class="waitting-rules-text">
					<div>初始手卡数：</div>
					<div>5</div>
				</div>
				<div class="waitting-rules-text">
					<div>每回合抽卡：</div>
					<div>1</div>
				</div>
			</div>
	</div>
	<div class="waitting-buttons-background">
		<button class="waitting-buttons-text">→观战</button>
		<button class="waitting-buttons-text" @click="ready">{{readytext}}</button>
	</div>
    <div class="waitting-deck-background">
        <span>卡组选择：</span>
        <select v-model="deckclass1" class="waitting-deck-text">
        	<option>未分类卡组</option>
        </select>
        <select v-model="deck1" class="waitting-deck-text">
        	<option>AI_Maliss</option>
        </select>
    </div>
    </div>
</div>
</template>

<script setup lang="ts">

import { ref,computed } from 'vue'

const props = defineProps<{
	name : string[];
	value : boolean;
}>();

const value = ref(false)
const readytext = computed(() => value.value ? '取消准备' : '准备')
const ready = () => {
	value.value = !value.value
}

const deckclass1 = ref('未分类卡组')
const deck1 = ref('AI_Maliss')

</script>

<style scoped lang="scss">
.waitting-background {
	display: contents;
	color: white;

	.waitting-title {
    	background: #1a1a4d;
    	padding: 8px 16px;
    	font-weight: bold;
    	border-radius: 4px 4px 0 0;
	}

	.waitting-text {
		display: flex;
		flex-direction: column;
    	background: #010112;
    	border-radius: 4px;
    	padding: 20px;
    	box-shadow: 0 4px 8px #1a1a4d;

		.waitting-information { 
			display: flex;
			flex-direction: row;

			.waitting-player-background {
				margin-bottom: 20px;

				.waitting-player-team {
					padding: 6px 12px;
					margin-bottom: 10px;
				}

				.waitting-player-name {
					display: flex;
					flex-direction: row;
					align-items: center;
					margin: 8px 0;
				
					.waitting-player-logo {
						width: 24px;
						text-align: center;
						font-weight: bold;
					}

					.waitting-player-box {
						flex: 1;
						padding: 4px 8px;
						border: 1px solid #999;
						margin: 0 8px;
					}
				}
			}
			
			.waitting-rules-background {
				display: flex;
				flex-direction: column;
				margin-bottom: 20px;

				.waitting-rules-text {
					display: flex;
					flex-direction: row;
					margin: 4px 0;
				}
			}
		}
		.waitting-buttons-background {
			display: flex;
			gap: 16px;
			margin: 20px 0;

			.waitting-buttons-text {
				flex: 1;
				background: #e0e0e0;
				border: 1px solid #999;
				padding: 8px;
				cursor: pointer;
			}
		}
		
		.waitting-deck-background {
			display: flex;
			align-items: center;
			margin: 16px 0;

			.waitting-deck-text {
				flex: 1;
				padding: 4px 8px;
				border: 1px solid #999;
			}
    	}
	}
}
</style>