import { createYGOPicRecognizer, type YGOPicRecognizer } from 'ygopic-best';
import ygo_pic_wasm_url from 'ygopic-best/core-wasm/core_wasm_bg.wasm?url';
import model_url from 'ygopic-best/onnx?url';
import { convertFileSrc } from '@tauri-apps/api/core';

import Deck from './deck';

import invoke from '@/script/invoke';
import mainGame from '@/script/game';

class Pic_Recognizer {
	private recognizer ?: YGOPicRecognizer;
	init = async (hash : ArrayBuffer) : Promise<void> => {
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
				throw undefined;

			const path = convertFileSrc(file);
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = path;

			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(undefined);
			});

			const result = (await this.recognizer.recognizeImage(img, {
				includeArtworkUrl: true
			}))
			const cards = result
				.map(i => i.matches[0]?.id)
				.filter(i => i);

			for (const id of cards) {
				const c = mainGame.get.card(id);
				if (!c.id)
					continue;
				(c.is_ex() ? deck.extra : deck.main)
					.push(id);
			}
		} catch (e) {
			if (e)
				invoke.log.write(e);
		}
		return deck;
	}
};

const recognizer = new Pic_Recognizer();
export default recognizer;