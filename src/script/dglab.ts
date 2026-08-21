import { ref } from 'vue';
import WebSocket, { Message } from '@tauri-apps/plugin-websocket';
import * as dglab_server from 'tauri-plugin-dglab-ws-server';
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
import invoke from './invoke';

class DG {
	address ?: string;
	ws ?: WebSocket;
	socket ?: DglabManualSocket;
	target_id ?: string;
	client_id ?: string;
	secret ?: string;
	state = ref<DGLAB_SOCKET_STATE>(DGLAB_SOCKET_STATE.Idle);
	local_server : boolean = false;

    on = async () : Promise<string | undefined> => {
		if (this.address)
			return this.address;
		const address = mainGame.get.system(KEYS.SETTING_DGLAB_SERVER) as string;
		if (address)
			this.address = address;
		else {
			this.local_server = true;
			this.address = await dglab_server.startServer({ port : 0, prefix : '/', idleTimeoutMs: 0 });
		}
		
		try {
			const socket = new DglabSocket();
			socket.on('state', (state : DGLAB_SOCKET_STATE, previous) => {
				this.state.value = state === DGLAB_SOCKET_STATE.Disconnected
					? DGLAB_SOCKET_STATE.Idle
					: state;
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

			const result = await socket.connect();
			const url = `${this.address}/?tid=${result.targetId}`;
			
			this.ws = ws;
			this.socket = socket;
			this.target_id = result.targetId;
			this.secret = result.secret;
			return url;
		} catch (error) {
			await Promise.all([
				invoke.log.write(error),
				this.clear()
			]);
			return undefined;
		}
	};

	happen = async (val : number) : Promise<void> => {
		const socket = this.socket;
		const client_id = this.client_id;
		if (!socket || !client_id
			|| this.state.value !== DGLAB_SOCKET_STATE.Paired
			|| Number.isNaN(val)
		)
			return;
		const min_time = mainGame.get.system(KEYS.SETTING_DGLAB_MIN_TIME) as number;
		const max_time = mainGame.get.system(KEYS.SETTING_DGLAB_MAX_TIME) as number;
		const ratio_time = mainGame.get.system(KEYS.SETTING_DGLAB_RATIO_TIME) as number;
		const min_intensity = mainGame.get.system(KEYS.SETTING_DGLAB_MIN_INTENSITY) as number;
		const max_intensity = mainGame.get.system(KEYS.SETTING_DGLAB_MAX_INTENSITY) as number;
		const ratio_intensity = mainGame.get.system(KEYS.SETTING_DGLAB_RATIO_INTENSITY) as number;
		const duration = Math.min(max_time, Math.max(min_time, val / ratio_time));
		const value = Math.min(max_intensity, Math.max(min_intensity, val / ratio_intensity));
		const { devices } = await socket.requestDevices(client_id);
		const channels = [V4Channel.A, V4Channel.B];
		for (const device of devices) {
			const slot_id = device.slotId;
			const jobs: Array<Promise<any>> = [];
			for (const channel of channels) {
				jobs.push(
					socket.setTempIntensity(
						client_id,
						slot_id,
						channel,
						value,
						duration,
						{ immediate: true }
					)
				);
				jobs.push(
					socket.sendPulse(
						client_id,
						slot_id,
						channel,
						duration,
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
		if (this.local_server) {
			this.local_server = false;
			await dglab_server.stopServer();
		}
	};
};

const dg = new DG();

export default dg;