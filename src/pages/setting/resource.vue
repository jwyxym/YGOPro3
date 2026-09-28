<template>
	<div class = 'resource no-scrollbar' v-if = '!i18n'>
		<div class = 'avatar' v-for = 'i in page.avatar.list' :key = 'i.key'>
			<h4>{{ i.title }}</h4>
			<RecycleScroller
				class = 'horizontal'
				keyField = 'index'
				:items = 'mainGame.avatars'
				:item-size = '120'
				direction = 'horizontal'
			>
				<template v-slot = '{ item, index }'>
					<var-avatar
						@click = 'page.avatar.select(i, index)'
						:class = "{ 'select' : i.value === index }"
						:src = 'item'
						:size = '78'
					/>
				</template>
			</RecycleScroller>
		</div>
		<div class = 'back' v-for = '(i, v) in page.back.list' :key = 'v'>
			<div>
				<h4>{{ i.title }}</h4>
				<var-icon
					name = 'close-circle-outline'
					@click = 'page.back.close(i)'
				/>
			</div>
			<div
				:style = "{ '--url' : `url('${i.pic}')` }"
				:class = "{
					'self' : i.key === KEYS.BACKI && i.pic,
					'oppo' : i.key === KEYS.BACKII && i.pic
				}"
				@click = 'page.back.click(i)'
			/>
			<br/>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import { RecycleScroller } from 'vue-virtual-scroller';
	import { open } from '@tauri-apps/plugin-dialog';

	import mainGame from '@/script/game';
	import { KEYS } from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';
	import invoke from '@/script/invoke';

	interface Base {
		title : string;
	};
	interface Avatar extends Base {
		key : string;
		value : number;
	};
	interface Back extends Base {
		key : string;
		pic : string;
	};

	const page = reactive({
		avatar : {
			list : [
				{
					title : mainGame.get.text(I18N_KEYS.SETTING_AVATAR_SELF),
					key : KEYS.SETTING_AVATAR_SELF,
					value : mainGame.get.system(KEYS.SETTING_AVATAR_SELF) as number
				},
				{
					title : mainGame.get.text(I18N_KEYS.SETTING_AVATAR_OPPO),
					key : KEYS.SETTING_AVATAR_OPPO,
					value : mainGame.get.system(KEYS.SETTING_AVATAR_OPPO) as number
				},
				{
					title : mainGame.get.text(I18N_KEYS.SETTING_AVATAR_SERVER),
					key : KEYS.SETTING_AVATAR_SERVER,
					value : mainGame.get.system(KEYS.SETTING_AVATAR_SERVER) as number
				},
				{
					title : mainGame.get.text(I18N_KEYS.SETTING_AVATAR_WATCHER),
					key : KEYS.SETTING_AVATAR_WATCHER,
					value : mainGame.get.system(KEYS.SETTING_AVATAR_WATCHER) as number
				}
			] as Array<Avatar>,
			select : async (i : Avatar, v : number) => {
				i.value = v;
				await mainGame.set.system(i.key, v);
			}
		},
		back : {
			list : [
				{
					title : mainGame.get.text(I18N_KEYS.SETTING_BACK_SELF),
					key : KEYS.BACKI,
					pic : mainGame.get.textures(KEYS.OTHER, KEYS.BACKI)
				},
				{
					title : mainGame.get.text(I18N_KEYS.SETTING_BACK_OPPO),
					key : KEYS.BACKII,
					pic : mainGame.get.textures(KEYS.OTHER, KEYS.BACKII)
				},
			] as Array<Back>,
			click : async (i : Back) => {
				const file = await (__WEB__ ?
					new Promise<File | undefined>((resolve) => {
						const input = document.createElement('input')
						input.type = 'file'
						input.accept = '.jpg,.png,jpeg,.webp'
						input.onchange = () => {
							resolve(input.files?.[0]);
							input.remove();
						};
						input.oncancel = () => {
							resolve(undefined);
							input.remove();
						};
						input.click();
					}) : open({
						multiple: false,
						directory: false,
						filters: [{
							name : 'Image',
							extensions : ['png', 'jpeg', 'jpg', 'webp']
						}]
					}));
				if (!file && !__WEB__) return;
				let v : string;
				let pic : string;
				let buffer : Uint8Array<ArrayBuffer> | Blob | undefined = undefined;
				if (__WEB__) {
					if (file) {
						buffer = file as File;
						pic = URL.createObjectURL(file as File);
					} else
						pic = '';
					v = '';
				} else if (__ANDROID__) {
					const { readFile } = await import('@tauri-apps/plugin-fs');
					buffer = await readFile(file as string);
					pic = URL.createObjectURL(new Blob([buffer]));
					v = `other/back_I${i.key === KEYS.BACKI ? '' : 'I'}`;
				} else {
					const { convertFileSrc } = await import('@tauri-apps/api/core');
					pic = `${convertFileSrc(file as string)}?t=${Date.now()}`;
					v = file as string;
				}
				if (i.pic.startsWith('blob:http'))
					URL.revokeObjectURL(i.pic);
				i.pic = pic;
				mainGame.textures.get(KEYS.OTHER)?.set(i.key, pic);
				await invoke.game.set_textures(i.key, v, buffer);
			},
			close : async (i : Back) => {
				if (!i.pic)
					return;
				if (i.pic.startsWith('blob:http'))
					URL.revokeObjectURL(i.pic);
				i.pic = '';
				mainGame.textures.get(KEYS.OTHER)?.set(i.key, '');
				await invoke.game.set_textures(i.key, '');
			}
		}
	});

	const props = defineProps<{
		i18n : boolean
	}>();
</script>
<style scoped lang = 'scss'>
	.resource {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		> div {
			width: 100%;
			border-bottom: 1px solid white;
		}
		.avatar {
			height: 150px;
			> div {
				width: 100%;
				height: 100px;
				.select {
					outline: 2px solid yellow;
				}
			}
		}
		.back {
			display: flex;
			flex-direction: column;
			> div:first-child {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			> div:nth-child(2) {
				width: min(80%, calc(500px * 2.069));
				aspect-ratio: 2.069 / 1;
				align-self: center;
				border: 1px solid white;
				background-image: var(--url);
				background-size: cover;
				background-position: center;
				background-repeat: no-repeat;
				position: relative;
				&::after {
					content: '';
					position: absolute;
					inset: -2px;
					padding: 2px;
					pointer-events: none;
					-webkit-mask:
						linear-gradient(#fff 0 0) content-box,
						linear-gradient(#fff 0 0);
					mask:
						linear-gradient(#fff 0 0) content-box,
						linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
					animation: rotate 2s linear infinite;
				}
				&.self::after {
					background: conic-gradient(
						from var(--angle),
						#9ed3ff,
						#d8f2ff,
						#00d5ff,
						#5f9cff,
						#9ed3ff
					);
				}
				&.oppo::after {
					background: conic-gradient(
						from var(--angle),
						red,
						#ffd0d0,
						#ff4a4a,
						#b80000,
						red
					);
				}
			}
		}
	}

	@property --angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes rotate {
		to { --angle: 360deg; }
	}
</style>