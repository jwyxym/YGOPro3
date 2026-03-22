<template>
	<div class = 'server'>
		<div>
			<Input
				:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_NAME)'
				v-model = 'server.name'
			/>
		</div>
		<div>
			<div>
				<Select
					name = 'protoca'
					v-model = 'server.protocal'
				/>
				<AutoInput
					:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_ADDRESS)'
					:options = server.options
					v-model = 'server.address'
				/>
			</div>
		</div>
		<div>
			<div>
				<Select name = 'model' v-model = 'server.model' multiple/>
				<Input
					:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_PASSWORD)'
					v-model = 'server.input_pass'
				/>
			</div>
			<div>
				<div><b>{{ server.pass }}</b></div>
				<div>
					<Button
						:content = 'mainGame.get.text(I18N_KEYS.SERVER_CONNECT)'
						@click = "emit('connect', {
							name : server.name,
							pass : server.pass,
							address : server.address,
							protocal : server.protocal
						})"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { computed, reactive } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';

	import Input from '@/pages/ui/input.vue';
	import AutoInput from '@/pages/ui/auto_input.vue';
	import Select from '@/pages//ui/select.vue';
	import Button from '@/pages//ui/button.vue';


	const server = reactive({
		name : mainGame.get.system(KEYS.SETTING_SERVER_PLAYER_NAME) as string,
		address : mainGame.get.system(KEYS.SETTING_SERVER_ADDRESS) as string,
		protocal : 0 as 0 | 1 | 2,
		model : [],
		input_pass : mainGame.get.system(KEYS.SETTING_SERVER_PASS) as string,
		pass: computed(() : string => {
			return `
				${server.model.join(',')}${server.model.length > 0 ?
					server.input_pass.includes('#') ?
						server.input_pass.startsWith('#') ?
							'' : ','
								: '#'
									: ''
				}${server.input_pass}
			`;
		}),
		options : computed(() => {
			return Array.from(mainGame.servers).map(([k, v]) => ({ label: v, value: k }));
		}),
	});

	const emit = defineEmits<{
		connect : [server : {
			name : string;
			pass : string;
			address : string;
			protocal : 0 | 1 | 2
		}];
	}>();

</script>
<style scoped lang = 'scss'>
	.server {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 330px;
		width: 800px;
		border-radius: 4px;
		background-color: rgba(0, 0, 0, 0.2);
		color: white;
		> div {
			height: 70px;
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			> div {
				width: 80%;
			}
		}
		> div:nth-child(2) {
			> div {
				display: flex;
				gap: 10%;
				> div:first-child {
					width: 30%;
				}
				> div:last-child {
					width: 60%;
				}
			}
		}
		> div:last-child {
			height: 120px;
			display: flex;
			flex-direction: column;
			gap: 5px;
			> div {
				height: 70px;
				display: flex;
				gap: 10%;
				> div:first-child {
					width: 30%;
				}
				> div:last-child {
					width: 60%;
				}
			}
			> div:last-child {
				position: relative;
				> div {
					position: absolute;
					height: 100%;
				}
				> div:first-child {
					width: 60%;
					left: 0;
					top: 0;
					overflow-wrap: break-word;
				}
				> div:last-child {
					width: 20%;
					right: 0;
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}
		}
	}
</style>