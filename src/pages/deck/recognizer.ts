import { createYGOPicRecognizer, type YGOPicRecognizer } from 'ygopic-best';
import ygo_pic_wasm_url from 'ygopic-best/core-wasm/core_wasm_bg.wasm?url';
import model_url from 'ygopic-best/onnx?url';

import Deck from './deck';

import invoke from '@/script/invoke';
import mainGame from '@/script/game';

class Pic_Recognizer {
	private recognizer ?: YGOPicRecognizer;
	init = async (hash : ArrayBuffer) : Promise<void> => {
		console.log('hash length:', hash.byteLength);
		if (this.recognizer) return;
		this.recognizer = await createYGOPicRecognizer({
			modelUrl : model_url,
			hashDb : hash,
			wasmPath : ygo_pic_wasm_url,
			ortNumThreads : 1
		});
	};

	on = async (file : string) : Promise<Deck> => {
		const deck = new Deck({
			main : [],
			side : [],
			extra : [],
			name : ''
		});
		deck.is_new();
		try {
			if (!this.recognizer)
				throw 'recognizer init error';

			const path = await (async () => {
				if (__ANDROID__) {
					const { readFile } = await import('@tauri-apps/plugin-fs');
					const buffer = await readFile(file);
					return URL.createObjectURL(new Blob([new Uint8Array(buffer)]));
				} else {
					const { convertFileSrc } = await import('@tauri-apps/api/core');
					return convertFileSrc(file);
				}
			})();
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = path;

			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject('img load failed');
			});

			const result = (await this.recognizer.recognizeImage(img, {
				includeArtworkUrl: true
			}))
			console.log('result:', result);
			const cards = result
				.map(i => i.matches[0]?.id)
				.filter(i => i);
			console.log('cards:', cards);
			if (__ANDROID__)
				URL.revokeObjectURL(path);

			for (const id of cards) {
				const c = mainGame.get.card(id);
				if (!c.id)
					continue;
				(c.is_ex() ? deck.extra : deck.main)
					.push(id);
			}
		} catch (e) {
			invoke.log.write(e);
		}
		return deck;
	}
};

const recognizer = new Pic_Recognizer();
export default recognizer;