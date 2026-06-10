<template>
	<div class = 'replay'>
		<TransitionGroup tag = 'div' name = 'move_left' class = 'no-scrollbar'>
			<h2
				v-for = '(i, v) in page.list'
				:key = 'i.key'
				:class = "{ 'selected' : page.selected === v }"
				@click = 'page.select(v)'
				class = 'pointer'
			>{{ i.name }}</h2>
		</TransitionGroup>
		<transition name = 'opacity'>
			<var-form
				@submit = 'page.rename'
				v-show = 'page.selected > - 1'
			>
				<div class = 'input'>
					<transition name = 'opacity'>
						<Input
							v-if = 'page.selected > - 1'
							:placeholder = 'mainGame.get.text(I18N_KEYS.REPLAY_NAME)'
							v-model = 'page.name'
							:rules = 'page.rule'
							:maxlength = '248'
						/>
					</transition>
				</div>
				<var-cell>
					<template #extra>
						<Button
							native-type = 'submit'
							:content = 'mainGame.get.text(I18N_KEYS.REPLAY_RENAME)'
						/>
					</template>
				</var-cell>
				<var-cell>
					<template #extra>
						<Button
							@click = 'page.del'
							:content = 'mainGame.get.text(I18N_KEYS.REPLAY_DEL)'
						/>
					</template>
				</var-cell>
				<var-cell>
					<template #extra>
						<Button
							@click = 'page.connect'
							:content = 'mainGame.get.text(I18N_KEYS.REPLAY_ON)'
						/>
					</template>
				</var-cell>
			</var-form>
		</transition>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount, onUnmounted, reactive } from 'vue';
	import hotkeys from 'hotkeys-js';

	import mainGame from '@/script/game';
	import invoke from '@/script/invoke';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS, REG } from '@/script/constant';

	import Input from '@/pages/ui/input.vue';
	import Button from '@/pages/ui/button.vue';
	import Dialog from '@/pages/ui/dialog';

	const page = reactive({
		name : '',
		selected : -1,
		list : [] as Array<{ name : string; key : number; }>,
		select : async (v : number) => {
			if (page.selected === v) {
				page.name = '',
				page.selected = - 1;
			} else {
				page.selected = - 1;
				await mainGame.sleep(100);
				page.name = page.list[v].name,
				page.selected = v;
			}
		},
		connect : () => {
			const selected = page.list[page.selected];
			if (!selected) return;
			emit('connect', {
				replay : page.list[page.selected].name
			});
		},
		rename : async () => {
			if (page.name !== page.list[page.selected].name
				&& page.rule(page.name) === true &&
				await invoke.replay.rename(page.list[page.selected].name, page.name))
				page.list[page.selected].name = page.name;
		},
		del : async () => {
			if (await Dialog({
				title : mainGame.get.text(I18N_KEYS.REPLAY_DELETE_TITLE),
				message : mainGame.get.text(I18N_KEYS.REPLAY_DELETE_MESSAGR, page.list[page.selected].name)
			}, mainGame.get.system(KEYS.SETTING_CHK_DELETE_REPLAY)) && await invoke.replay.del(page.name)) {
				page.list.splice(page.selected, 1);
				page.selected = - 1;
			}
		},
		rule : (name ?: string) : string | true => {
			if (name === undefined || name.length === 0)
				return mainGame.get.text(I18N_KEYS.RULE_NAME_LEN);
			if (name.match(REG.NAME))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_UNLAWFUL);
			if (page.list.find(i => i.name === name))
				return mainGame.get.text(I18N_KEYS.RULE_NAME_EXIST);
			return true;
		}
	});

	onBeforeMount(async () : Promise<void> => {
		page.list = (await invoke.replay.list()).map((i, v) => {
			return { name : i, key : v};
		});
		hotkeys('down, pagedown', () => {
			const len = page.list.length - 1;
			page.selected = page.selected >= len ? 0 : page.selected + 1;
		});
		hotkeys('up, pageup', () => {
			const len = page.list.length - 1;
			page.selected = page.selected <= 0 ? len : page.selected - 1;
		});
	});

	onUnmounted(() => {
		hotkeys.unbind('down, pagedown');
		hotkeys.unbind('up, pageup');
	});

	const emit = defineEmits<{
		connect : [replay : {
			replay : string
		}];
	}>();
</script>
<style scoped lang = 'scss'>
	.replay {
		display: flex;
		height: calc(var(--height) * 0.8);
		width: calc(var(--width) * 0.8);
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.2);
		color: white;
		[media = 'mobile'] & {
			--cell-font-size: 24px;
		}
		> div, > form {
			height: 100%;
			width: calc(50% - 2px);
			border: 1px solid white;
		}
		> div {
			overflow-y: auto;
			h2 {
				font-size: 18px;
				transition: all 0.2s ease;
				transform: translateX(10px);
				[media = 'mobile'] & {
					font-size: 32px;
				}
				[media = 'pc'] & {
					font-size: 18px;
				}
			}
			.selected {
				text-shadow:
					0 0 5px aqua,
					0 0 10px aqua,
					0 0 20px aqua,
					0 0 40px aqua;
				transform: translateX(10px);
			}
		}
		> form {
			display: flex;
			flex-direction: column;
			align-items: center;
			.input {
				height: 100px;
				width: 80%;
				display: flex;
				align-items: center;
				.var-input {
					[media = 'mobile'] & {
						transform: scale(140%);
						width: 70%;
						transform-origin: left center;
					}
					[media = 'pc'] & {
						width: 100%;
					}
				}
			}
			.var-cell {
				width: 80%;
				[media = 'mobile'] & {
					height: 100px;
					.var-button {
						transform: scale(140%);
					}
				}
				:deep(.var-cell__extra) {
					height: 40px;
				}
				:deep(.var-input) {
					width: 200px;
				}
			}
		}
	}
	.move_left {
		&-enter-active,
		&-leave-active {
			transition: transform 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			transform: translateX(- var(--width));
		}

		&-enter-to,
		&-leave-from {
			transform: translateX(0);
		}
	}
	.opacity {
		&-enter-active,
		&-leave-active {
			transition: opacity 0.2s ease;
		}

		&-enter-from,
		&-leave-to {
			opacity: 0;
		}

		&-enter-to,
		&-leave-from {
			opacity: 1;
		}
	}
</style>