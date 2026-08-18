<template>
	<div class = 'dglab'>
		<Head
			v-model:show = 'page.show'
			:title = 'mainGame.get.text(I18N_KEYS.SETTING_DGLAB)'
			@off = "emit('off', 'DGLAB')"
		/>
		<var-list :style = "{ '--h' : `${page.show ? 4 * 60 : 0}px` }">
			<var-cell
				v-for = 'i in page.string'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
			>
				<template #extra>
					<Input
						v-model = 'i.value'
						:clearable = 'false'
						@blur = "emit('change', i)"/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.number'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
			>
				<template #extra>
					<var-counter
						:min = '0'
						:max = '200'
						v-model = 'i.value'
						@change = 'page.change(i)'/>
				</template>
			</var-cell>
		</var-list>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive } from 'vue';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';

	import Input from '@/pages/ui/input.vue';

	import Head from './head.vue';

	const page = reactive({
		show : false,
		string : [] as Array<{ i18n : number, key : string; value : string; }>,
		number : [] as Array<{ i18n : number, key : string; value : number; }>,
		change : (i : { i18n : number, key : string; value : any; }) => {
			if (i.key === KEYS.SETTING_DGLAB_MAX) {
				const min = page.number[0].value;
				i.value = Math.max(min + 1, i.value);
			} else if (i.key === KEYS.SETTING_DGLAB_MIN) {
				const max = page.number[1];
				if (max.value <= i.value) {
					max.value = i.value + 1;
					emit('change', max);
				}
			}
			emit('change', i);
		}
	});

	const emit = defineEmits<{
		change : [{ i18n : number, key : string; value : any; }]
		off : [string];
	}>();

	onBeforeMount(() => {
		page.string = [
			'SETTING_DGLAB_SERVER'
		].map(i => {
			return {
				i18n : I18N_KEYS[i as keyof typeof I18N_KEYS],
				key : KEYS[i as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i as keyof typeof KEYS]) as string,
			};
		});
		page.number = [
			'SETTING_DGLAB_MIN',
			'SETTING_DGLAB_MAX',
			'SETTING_DGLAB_RATIO'
		].map(i => {
			return {
				i18n : I18N_KEYS[i as keyof typeof I18N_KEYS],
				key : KEYS[i as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i as keyof typeof KEYS]) as number,
			};
		});

	});
</script>
<style scoped lang = 'scss'>
	.dglab {
		.var-cell {
			height: 60px;
		}
		.var-list {
			transition: all 0.2s ease;
			overflow-y: hidden;
			height: var(--h);
		}
	}
</style>