<template>
	<div class = 'pic'>
		<transition name = 'move'>
			<div
				v-if = 'pic'
				:style = "{ '--url' : `url(${pic})` }"
			/>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	const props = defineProps<{
		pic ?: string;
	}>();
</script>
<style scoped lang = 'scss'>
	.pic {
		pointer-events: none;
		> div {
			position: fixed;
			left: 50%;
			top: 50%;
			height: calc(var(--height) * 0.5);
			aspect-ratio: 1 / 1.45;
			transform: translate(-50%, -50%);
			background-image: var(--url);
			background-size: cover;

			&.move-enter-active,
			&.move-leave-active {
				transition: transform 0.1s ease;
			}

			&.move-enter-from {
				transform: translate(-50%, calc(var(--height) / var(--scale)));
			}

			&.move-leave-to {
				transform: translate(-50%, calc(-1 * var(--height) / var(--scale)));
			}
		}
	}
</style>
