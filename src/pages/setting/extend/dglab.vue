<template>
	<div class = 'dglab'>
		<Head
			v-model:show = 'page.show'
			:title = 'mainGame.get.text(I18N_KEYS.SETTING_DGLAB)'
			@off = "emit('off', 'DGLAB')"
		/>
		<var-list :style = "{ '--h' : `${page.show
				? page.height + (dg.state.value === DGLAB_SOCKET_STATE.Idle ? 0 : 340)
				: 0
			}px`
		}">
			<var-cell
				:title = '`${mainGame.get.text(I18N_KEYS.SETTING_DGLAB_STATUS)} ${page.state}`'
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
			<div
				class = 'qrcode'
				:style = "{ '--h' : `${dg.state.value === DGLAB_SOCKET_STATE.Idle
						? 0 : 340
					}px`
				}"
			>
				<var-cell>
					<template #default>
						<canvas ref = 'qrcode'/>
					</template>
					<template #extra>
						<Button
							:content = 'mainGame.get.text(I18N_KEYS.OPEN_URL)'
							@click = 'page.open_url'
						/>
						<Button
							:content = 'mainGame.get.text(I18N_KEYS.COPY)'
							@click = 'page.copy'
						/>
					</template>
				</var-cell>
				<p v-if = 'dg.state.value !== DGLAB_SOCKET_STATE.Idle'>
					{{ mainGame.get.text(I18N_KEYS.SETTING_DGLAB_URL) }} {{ dg.url }}
				</p>
			</div>
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
						:input-width = '50'
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
	import { computed, onBeforeMount, onMounted, reactive, useTemplateRef, watch } from 'vue';
	import { DGLAB_SOCKET_STATE } from 'dglab-kit';
	import QRCode from 'qrcode';
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import * as Opener from '@tauri-apps/plugin-opener';

	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';
	import dg from '@/script/dglab';
	import invoke from '@/script/invoke';
	import GLOBAL from '@/script/scale';

	import { toast } from '@/pages/toast/toast';
	import Input from '@/pages/ui/input.vue';
	import Button from '@/pages/ui/button.vue';

	import Head from './head.vue';

	const canvas = useTemplateRef<HTMLCanvasElement>('qrcode');

	const page = reactive({
		height : computed(() => 9 * (GLOBAL.SCALE < 0.6 ? 100 : 60) + 1),
		show : false,
		string : [] as Array<{ i18n : number, key : string; value : string; }>,
		number : [] as Array<{ i18n : number, key : string; value : number; max ?: number; }>,
		test : 1000,
		state : computed(() => {
			let key;
			switch (dg.state.value) {
				case DGLAB_SOCKET_STATE.Connecting:
					key = I18N_KEYS.SETTING_DGLAB_CONNECT;
					break;
				case DGLAB_SOCKET_STATE.WaitingForPeer:
					key = I18N_KEYS.SETTING_DGLAB_WAITING;
					break;
				case DGLAB_SOCKET_STATE.Paired:
					key = I18N_KEYS.SETTING_DGLAB_PAIRED;
					break;
				default:
					key = I18N_KEYS.SETTING_DGLAB_DISCONNECT;
			}
			return mainGame.get.text(key);
		}),
		change : (i : { i18n : number, key : string; value : any; }) => {
			if (i.key === KEYS.SETTING_DGLAB_MAX_INTENSITY) {
				const min = page.number[0].value;
				i.value = Math.max(min, i.value);
			} else if (i.key === KEYS.SETTING_DGLAB_MIN_INTENSITY) {
				const max = page.number[1];
				if (max.value <= i.value) {
					max.value = i.value;
					emit('change', max);
				}
			} else if (i.key === KEYS.SETTING_DGLAB_MAX_TIME) {
				const min = page.number[3].value;
				i.value = Math.max(min, i.value);
			} else if (i.key === KEYS.SETTING_DGLAB_MIN_TIME) {
				const max = page.number[4];
				if (max.value <= i.value) {
					max.value = i.value;
					emit('change', max);
				}
			}
			emit('change', i);
		},
		connect : async () => {
			if (dg.state.value === DGLAB_SOCKET_STATE.Idle) {
				await dg.on(() => {
					if (canvas.value) {
						const ctx = canvas.value.getContext('2d');
						ctx?.clearRect(0, 0, canvas.value.width, canvas.value.height);
					}
				});
				page.to_canvas(canvas.value, dg.qrcode.value);
			} else
				await dg.disconnect();
		},
		copy : async () : Promise<void> => {
			if (!dg.url.value)
				return;
			try {
				await writeText(dg.url.value);
				toast.info(mainGame.get.text(I18N_KEYS.COPY_COMPELETE));
			} catch (e) {
				await invoke.log.write(e);
			}
		},
		to_canvas : (canvas : HTMLCanvasElement | null, qrcode ?: string) => {
			if (canvas && qrcode)
				QRCode.toCanvas(canvas, qrcode, {
					width: 256,
					margin: 2,
						color: {
							dark: '#000000',
							light: '#ffffff'
						}
					}
				);
		},
		open_url : async () => {
			try {
				if (dg.qrcode.value)
					await Opener.openUrl(dg.qrcode.value);
			} catch (e) {
				await invoke.log.write(e);
			}
		}
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
			['SETTING_DGLAB_MIN_INTENSITY', 200],
			['SETTING_DGLAB_MAX_INTENSITY', 200],
			['SETTING_DGLAB_RATIO_INTENSITY'],
			['SETTING_DGLAB_MIN_TIME'],
			['SETTING_DGLAB_MAX_TIME'],
			['SETTING_DGLAB_RATIO_TIME']
		].map(i => {
			return {
				i18n : I18N_KEYS[i[0] as keyof typeof I18N_KEYS],
				key : KEYS[i[0] as keyof typeof KEYS],
				value : mainGame.get.system(KEYS[i[0] as keyof typeof KEYS]) as number,
				max : i[1] as number | undefined
			};
		});
	});

	onMounted(() => {
		page.to_canvas(canvas.value, dg.qrcode.value);
	});

	watch(() => page.show, (n : boolean) => {
		if (n)
			emit('open', page.height + (dg.state.value === DGLAB_SOCKET_STATE.Idle ? 0 : 340));
	});
</script>
<style scoped lang = 'scss'>
	.dglab {
		width: 100%;
		.var-list {
			width: 100%;
			height: var(--h);
			transition: all 0.2s ease;
			overflow: hidden;
			.qrcode {
				height: var(--h);
				width: 100%;
				overflow-y: hidden;
				display: flex;
				flex-direction: column;
				border-bottom: 1px solid white;
				transition: all 0.2s ease;
				p {
					width: calc(100% - 20px);
					transform: translateX(20px);
					[media = 'mobile'] & {
						font-size: 20px;
					}
				}
				> .var-cell {
					height: calc(100% - 20px);
					[media = 'mobile'] & {
						width: calc(100% - 10px);
					}
					border: none;
					:deep(.var-cell__extra) {
						display: flex;
						flex-direction: column;
						gap: 30px;
					}
				}
			}
		}
	}
</style>