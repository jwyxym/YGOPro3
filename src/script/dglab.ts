import { ref } from 'vue';
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

import { connect, WebSocket, type Message } from './websocket';
import mainGame from './game';
import { KEYS, URL } from './constant';
import invoke from './invoke';

const WAVEFORM = Object.entries(COYOTE_WAVEFORM).map(i => i[1]);

class DG {
	address ?: string;
	url = ref<string | undefined>(undefined);
	qrcode = ref<string | undefined>(undefined);
	ws ?: WebSocket;
	socket ?: DglabManualSocket;
	target_id ?: string;
	client_id ?: string;
	secret ?: string;
	state = ref<DGLAB_SOCKET_STATE>(DGLAB_SOCKET_STATE.Idle);
	local_server : boolean = false;
	script ?: string;
	index : number = 0;

	waveform = () : Array<string> | undefined => {
		const waveforms = mainGame.get.system(KEYS.SETTING_DGLAB_WAVEFORM) as Array<string>;
		const i = this.index ++;
		if (this.index >= frames.length)
			this.index = 0;
		return COYOTE_WAVEFORMS[waveforms[i] as COYOTE_WAVEFORM]?.raw;
	};

    on = async (clear : () => void) : Promise<void> => {
		if (this.address)
			return;
		const address = mainGame.get.system(KEYS.SETTING_DGLAB_SERVER) as string;
		if (address)
			this.address = address;
		else {
			this.local_server = true;
			this.address = await dglab_server.startServer({ port : 0, prefix : '/', idleTimeoutMs: 0 });
		}
		
		try {
			const socket = new DglabSocket();
			socket.on('state', (state : DGLAB_SOCKET_STATE) => {
				state === DGLAB_SOCKET_STATE.Disconnected
					? this.clear(clear) : this.state.value = state;
			});
			socket.on('device', (_ : DglabSocketDeviceEventPayload, id : string) => this.client_id = id);
			socket.on('client-attached', async (id : string) => this.client_id = id);
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
			this.url.value = `${this.address}/?tid=${result.targetId}`;
			this.qrcode.value = `${URL.DGLAB}${encodeURIComponent(this.url.value)}`;
			
			this.ws = ws;
			this.socket = socket;
			this.target_id = result.targetId;
			this.secret = result.secret;
			const script : string = mainGame.get.system(KEYS.SETTING_DGLAB_SCRIPT) as string;
			this.script = await invoke.extend.load('DGLAB', script);

			return;
		} catch (error) {
			await Promise.all([
				invoke.log.write(error),
				this.clear(clear)
			]);
			return;
		}
	};

	happen = async (val : number) : Promise<void> => {
		try {
			const socket = this.socket;
			const client_id = this.client_id;
			if (!socket || !client_id
				|| this.state.value !== DGLAB_SOCKET_STATE.Paired
				|| Number.isNaN(val)
			)
				return;
			let duration;
			let value;
			let waveform;
			if (this.script) {
				const result = await invoke.extend
					.call<[number, number, Array<string> | number | undefined]>(this.script, [val, WAVEFORM]);
				if (!Array.isArray(result)
					|| result.length < 2
					|| typeof result[0] !== 'number'
					|| typeof result[1] !== 'number'
				)
					throw new TypeError('DGLAB custom script should return at least two items in an array');
				[value, duration] = result;
				const index = result[2];
				if (typeof index === 'number' && index > - 1) {
					const key = WAVEFORM[index];
					if (key)
						waveform = COYOTE_WAVEFORMS[key].raw;
				}
				else if (Array.isArray(index) && index.length)
					waveform = index;
			} else {
				const min_time = mainGame.get.system(KEYS.SETTING_DGLAB_MIN_TIME) as number;
				const max_time = mainGame.get.system(KEYS.SETTING_DGLAB_MAX_TIME) as number;
				const ratio_time = mainGame.get.system(KEYS.SETTING_DGLAB_RATIO_TIME) as number;
				const min_intensity = mainGame.get.system(KEYS.SETTING_DGLAB_MIN_INTENSITY) as number;
				const max_intensity = mainGame.get.system(KEYS.SETTING_DGLAB_MAX_INTENSITY) as number;
				const ratio_intensity = mainGame.get.system(KEYS.SETTING_DGLAB_RATIO_INTENSITY) as number;
				duration = Math.min(max_time, Math.max(min_time, val / ratio_time));
				value = Math.min(max_intensity, Math.max(min_intensity, val / ratio_intensity));
				waveform = this.waveform();
			}
			duration = duration * 1000;
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
							waveform ?? COYOTE_WAVEFORMS[COYOTE_WAVEFORM.BUBBLE].raw,
							{ immediate: true }
						)
					);
				}
				await Promise.all(jobs);
			}
		} catch (error) {
			await invoke.log.write(error);
		}
	};

	disconnect = async () => {
		await this.ws?.disconnect();
		this.socket?.disconnect();
	};

	clear = async (clear : () => void) => {
		clear();
		this.address = undefined;
		this.url.value = undefined;
		this.qrcode.value = undefined;
		this.ws = undefined;
		this.socket = undefined;
		this.target_id = undefined;
		this.client_id = undefined;
		this.secret = undefined;
		this.index = 0;
		this.state.value = DGLAB_SOCKET_STATE.Idle;
		const promise = [];
		if (this.local_server) {
			promise.push(dglab_server.stopServer());
			this.local_server = false;
		}
		if (this.script) {
			promise.push(invoke.extend.unload(this.script));
			this.script = undefined;
		}
		await Promise.all(promise);
	};
};

const dg = new DG();

export default dg;