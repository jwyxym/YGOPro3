<template>
	<div class = 'dglab'>
		<Head
			v-model:show = 'page.show'
			:title = 'mainGame.get.text(I18N_KEYS.SETTING_DGLAB)'
			@off = "emit('off', 'DGLAB')"
		/>
		<var-list :style = "{ '--h' : `${page.show ? 6 * 60 : 0}px` }">
			<var-cell
				:title = 'mainGame.get.text(I18N_KEYS.SETTING_DGLAB_STATUS)'
				:description = '(dg.state as any as string)'
			>
				<template #extra>
					<Button
						:content = 'mainGame.get.text(
							dg.state.value === DGLAB_SOCKET_STATE.Idle
								? I18N_KEYS.SERVER_CONNECT : I18N_KEYS.SERVER_DISCONNECT
							)
						'
						@click = 'page.connect'
					/>
				</template>
			</var-cell>
			<var-cell
				v-for = 'i in page.string'
				:key = 'i.key'
				:title = 'mainGame.get.text(i.i18n)'
			>
				<template #extra>
					<Input
						v-model = 'i.value'
						:clearable = 'false'
						@blur = 'page.change(i)'/>
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
						:max = i.max
						v-model = 'i.value'
						@change = 'page.change(i)'/>
				</template>
			</var-cell>
			<var-cell>
				<template #default>
					<Input
						:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DGLAB_TEST_LP)'
						v-model = 'page.test'
						type = 'number'
					/>
				</template>
				<template #extra>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.TEST)'
						@click = 'dg.happen(Number(page.test))'
					/>
				</template>
			</var-cell>
		</var-list>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, reactive, watch } from 'vue';
	import { DGLAB_SOCKET_STATE } from 'dglab-kit';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';
	import dg from '@/script/dglab';

	import Input from '@/pages/ui/input.vue';
	import Button from '@/pages/ui/button.vue';

	import Head from './head.vue';

	const page = reactive({
		show : false,
		string : [] as Array<{ i18n : number, key : string; value : string; }>,
		number : [] as Array<{ i18n : number, key : string; value : number; max ?: number; }>,
		test : 1000,
		url : undefined as string | undefined,
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
		},
		connect : async () => dg.state.value === DGLAB_SOCKET_STATE.Idle
			? page.url = await dg.on() : await dg.clear()
	});

	const emit = defineEmits<{
		change : [{ i18n : number, key : string; value : any; }]
		off : [string];
		open : [number];
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
			['SETTING_DGLAB_MIN', 200],
			['SETTING_DGLAB_MAX', 200],
			['SETTING_DGLAB_RATIO', undefined]
		].map(i => {
			return {
				i18n : I18N_KEYS[i[0] as keyof typeof I18N_KEYS],
				key : KEYS[i[0] as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i[0] as keyof typeof KEYS]) as number,
				max : i[1] as number | undefined
			};
		});
	});

	watch(() => page.show, (n : boolean) => {
		if (n)
			emit('open', 360);
	});
</script>
<style scoped lang = 'scss'>
	.dglab {
		.var-cell {
			height: 60px;
			.var-input {
				width: 500px;
			}
		}
		.var-list {
			transition: all 0.2s ease;
			overflow-y: hidden;
			height: var(--h);
		}
	}
</style>