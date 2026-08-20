import { ref } from 'vue';
import WebSocket, { Message } from '@tauri-apps/plugin-websocket';
import {
	COYOTE_WAVEFORM,
	COYOTE_WAVEFORMS,
	DglabSocket,
	V4Channel,
	DGLAB_SOCKET_STATE,
	type DglabSocketOutgoing,
	type DglabManualSocket,
	type DglabSocketDeviceEventPayload
} from 'dglab-kit';
import { connect } from './websocket';
import mainGame from './game';
import { KEYS } from './constant';

class DG {
	address ?: string;
	ws ?: WebSocket;
	socket ?: DglabManualSocket;
	target_id ?: string;
	client_id ?: string;
	secret ?: string;
	state = ref<DGLAB_SOCKET_STATE>(DGLAB_SOCKET_STATE.Idle);

    on = async () => {
		const address = mainGame.get.system(KEYS.SETTING_DGLAB_SERVER) as string;
		this.address = address// ? address : ;
		const socket = new DglabSocket();
		const ws = await connect(this.address, (i : Message) => {
			switch (i.type) {
				case 'Text':
				case 'Binary':
					socket.handleMessage(i.data);
					break;
				case 'Close': 
					socket.handleClose(i.data);
			};
		});
		socket.setSender((data : DglabSocketOutgoing) => ws.send(
			typeof data === 'string'
				? data : Array.from(
					data instanceof ArrayBuffer
						? new Uint8Array(data)
						: new Uint8Array(
							data.buffer,
							data.byteOffset,
							data.byteLength
						)
				)
		));

		socket.on('state', (state : DGLAB_SOCKET_STATE, previous) => {
			this.state.value = state;
			console.log('socket state:', previous, '->', state);
		});
		socket.on('devices', (devices, clientId) => {
			console.log('设备列表更新:', clientId, devices);
		});
		socket.on('device', (device : DglabSocketDeviceEventPayload, id : string) => {
			console.log('单设备变化:', id, device);
			this.client_id = id;
		});
		socket.on('action', (action) => {
			console.log('APP 自定义动作:', action);
		});
		socket.on('client-attached', async (id : string) => {
			console.log('APP 接入:', id);
			this.client_id = id;
		});

		const result = await socket.connect();
		console.log('请将这个 APP 配对 ID 交给 DG-LAB 4 APP:', result.targetId);
		console.log('HTTP 鉴权密钥:', result.secret);
		const appSocketUrl = `${this.address}/?tid=${result.targetId}`;
		const qrcode = `https://dungeon-lab.cn/s/?v=1&action=socket&url=${encodeURIComponent(appSocketUrl)}`;
		console.log(appSocketUrl, qrcode)

		this.ws = ws;
		this.socket = socket;
		this.target_id = result.targetId;
		this.secret = result.secret;
	};

	happen = async (val : number) : Promise<void> => {
		if (isNaN(val)) return;
		const min = mainGame.get.system(KEYS.SETTING_DGLAB_MIN) as number;
		const max = mainGame.get.system(KEYS.SETTING_DGLAB_MAX) as number;
		const ratio = mainGame.get.system(KEYS.SETTING_DGLAB_RATIO) as number;
		const value = Math.min(max, Math.max(min, val / ratio));

		const socket = this.socket;
		const client_id = this.client_id;
		if (!socket || !client_id || this.state.value !== DGLAB_SOCKET_STATE.Paired)
			return;
		const { devices } = await socket.requestDevices(client_id);
		const channels = [V4Channel.A, V4Channel.B];
		for (const device of devices) {
			const slot_id = device.slotId;
			const jobs: Array<Promise<unknown>> = [];
			for (const channel of channels) {
				jobs.push(
					socket.setTempIntensity(
						client_id,
						slot_id,
						channel,
						value,
						1000,
						{ immediate: true }
					)
				);
				jobs.push(
					socket.sendPulse(
						client_id,
						slot_id,
						channel,
						1000,
						COYOTE_WAVEFORMS[COYOTE_WAVEFORM.BUBBLE].raw,
						{ immediate: true }
					)
				);
			}
			await Promise.all(jobs);
		}
	};

	clear = async () => {
		await this.ws?.disconnect();
		this.socket?.disconnect();
		this.address = undefined;
		this.ws = undefined;
		this.socket = undefined;
		this.target_id = undefined;
		this.client_id = undefined;
		this.secret = undefined;
		this.state.value = DGLAB_SOCKET_STATE.Idle;
	};
};

const dg = new DG();

export default dg;