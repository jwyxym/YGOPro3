<template>
	<div class = 'single'>
		<div>

		</div>
		<div>
			<var-cell
				title = '起始基本分'
			>
				<template #extra>
					<var-counter
						:min = '0'
						:max = '999'
						v-model = 'b'
					/>
				</template>
			</var-cell>
			<var-cell
				title = '起始手牌'
			>
				<template #extra>
					<var-counter
						:min = '0'
						:max = '999'
						v-model = 'b'
					/>
				</template>
			</var-cell>
			<var-cell
				title = '每轮抽卡'
			>
				<template #extra>
					<var-counter
						:min = '0'
						:max = '999'
						v-model = 'b'
					/>
				</template>
			</var-cell>
			<var-cell
				title = 'Bot锁定出剪刀'
			>
				<template #extra>
					<var-checkbox v-model="a"></var-checkbox>
				</template>
			</var-cell>
			<var-cell
				title = '不切洗卡组'
			>
				<template #extra>
					<var-checkbox v-model="a"></var-checkbox>
				</template>
			</var-cell>
			<var-cell
				title = '不洗牌'
			>
				<template #extra>
					<var-checkbox v-model="a"></var-checkbox>
				</template>
			</var-cell>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	const a = true;
	const b = 0;
</script>
<style scoped lang = 'scss'>
	.single {
		display: flex;
		height: calc(var(--height) * 0.8);
		width: calc(var(--width) * 0.8);
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.2);
		color: white;
		> div {
			height: 100%;
			width: 50%;
			border: 1px solid white;
		}
		> div:last-child {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			.var-cell {
				width: 80%;
				border-bottom: 1px solid white;
				:deep(.var-cell__extra) {
					height: 40px;
				}
			}
		}
	}
</style>