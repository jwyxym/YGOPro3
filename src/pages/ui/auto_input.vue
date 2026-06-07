<template>
	<var-auto-complete
		ref = 'input'
		:variant = "variant ? variant : 'standard'"
		:placeholder = 'placeholder'
		:rules = 'rules'
		:clearable = 'true'
		text-color = 'white'
		blur-color = 'white'
		size = 'small'
		:get-show = '() => { return true; }'
		@click.stop = 'focus'
	/>
</template>
<script setup lang = 'ts'>
	import { ref, onMounted, ComponentPublicInstance, onUnmounted } from 'vue';
	import { _AutoCompleteComponent, Rules } from '@varlet/ui';

	type AutoComplete = ComponentPublicInstance & _AutoCompleteComponent;
	const input = ref<AutoComplete | null>(null);

	let chk = false;

	const focus = () => {
		if (__ANDROID__) {
			if (chk) {
				const i = input.value?.$el.querySelector('input');
				i.removeAttribute('readonly');
			} else
				chk = true;
		}
	};

	const blur = (e : PointerEvent) => {
		if (__ANDROID__) {
			const target = e.target as HTMLElement;
			if (!target.classList
				.contains('var-auto-complete--standard-menu-margin')
			) {
				const i = input.value?.$el.querySelector('input');
				i.setAttribute('readonly', '');
				chk = false;
			}
		}
	};

	const exported = {
		blur : undefined as (() => void) | undefined
	};

	onMounted(() => {
		exported.blur = input.value?.blur;
		if (__ANDROID__) {
			window.addEventListener('click', blur);
			const i = input.value?.$el.querySelector('input');
			if (i)
				i.setAttribute('readonly', '');
		}
	});

	onUnmounted(() => {
		if (__ANDROID__)
			window.removeEventListener('click', blur);
	});

	defineProps<{
		placeholder ?: string;
		rules ?: Rules;
		variant ?: 'outlined' | 'standard';
	}>();

	defineExpose({
		exported
	});
</script>