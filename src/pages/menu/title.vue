<template>
	<div>
		<h2>YGOPro3</h2>
		&nbsp;
  		<span>v{{mainGame.version}}</span>
	</div>
</template>
<script setup lang = 'ts'>
	import mainGame from '@/script/game';
</script>
<style scoped lang = 'scss'>
	div {
		width: 100%;
		height: 20%;
		text-shadow:
			0 0 5px aqua,
			0 0 10px aqua,
			0 0 20px aqua,
			0 0 40px aqua;
		h2 {
			font-weight: 900;
			display: inline-block;
			vertical-align: bottom;
			margin: 0;
		}
		span {
			font-weight: 600;
			display: inline-block;
			vertical-align: bottom;
		}
	}
</style>