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
					name = 'protocol'
					v-model = 'server.protocal'
				/>
				<AutoInput
					@input = 'server.input'
					ref = 'input'
					:placeholder = 'mainGame.get.text(I18N_KEYS.SERVER_ADDRESS)'
					:options = 'server.options'
					v-model = 'server.address'
					@clear = '() => server.protocal = 0'
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
							address : server.address.trim(),
							protocal : server.protocal
						})"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { ref, computed, onBeforeMount, reactive, watch } from 'vue';
	import mainGame from '@/script/game';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';

	import Input from '@/pages/ui/input.vue';
	import AutoInput from '@/pages/ui/auto_input.vue';
	import Select from '@/pages//ui/select.vue';
	import Button from '@/pages//ui/button.vue';

	const input = ref<any>(null);
	let lock : boolean = false;
	const options = Array.from(mainGame.servers).map(([k, v]) => ({ label : v, value : k }));

	const server = reactive({
		name : mainGame.get.system(KEYS.SETTING_SERVER_PLAYER_NAME) as string,
		address : mainGame.get.system(KEYS.SETTING_SERVER_ADDRESS) as string,
		protocal : 0 as 0 | 1 | 2,
		model : [] as Array<string>,
		input_pass : mainGame.get.system(KEYS.SETTING_SERVER_PASS) as string,
		pass : computed(() : string => {
			return `${server.model.join(',')}${server.model.length > 0 ?
					server.input_pass.includes('#') ?
						server.input_pass.startsWith('#') ?
							'' : ','
								: '#'
									: ''
				}${server.input_pass}`;
		}),
		options : computed(() : Array<{
			label: string;
			value: string;
		}> => options.map(i => i.value === server.address ? {label : i.label, value : i.value + '\n'} : i)),
		input : () => lock = true
	});

	onBeforeMount(() => {
		const pass = (mainGame.get.system(KEYS.SETTING_SERVER_PASS) as string).split('#');
		if (pass.length > 1) {
			const model : Array<string> = [];
			pass[0].split(',').forEach(i => (mainGame.model.has(i) ? server.model : model).push(i));
			server.input_pass = `${model.join(',')}#${pass[pass.length - 1]}`;
		} else server.input_pass = pass[0];
		server.name = mainGame.get.system(KEYS.SETTING_SERVER_PLAYER_NAME) as string;
		const address = mainGame.get.system(KEYS.SETTING_SERVER_ADDRESS) as string;
		if (address.startsWith('ws://'))
			server.address = address.slice(5);
		else if (address.startsWith('wss://'))
			server.address = address.slice(6);
		else server.address = address;
		server.protocal = mainGame.get.system(KEYS.SETTING_SERVER_PROTOCAL) as 0 | 1 | 2;
	});

	const emit = defineEmits<{
		connect : [server : {
			name : string;
			pass : string;
			address : string;
			protocal : 0 | 1 | 2
		}];
	}>();

	watch(() => server.address, (n : string) => {
		if (n.startsWith('ws://')) {
			server.address = n.slice(5);
			server.protocal = 1;
		} else if (n.startsWith('wss://')) {
			server.address = n.slice(6);
			server.protocal = 2;
		} else if (options.find(i => i.value === n.trim()))
			server.protocal = 0;
		lock ? lock = false
			: input.value?.exported?.blur?.();
	}, { flush : 'post' });

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