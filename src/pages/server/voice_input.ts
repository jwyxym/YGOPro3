import { toast } from '@/pages/toast/toast';
import fs from '@/script/fs';

declare global {
	interface SpeechRecognition extends EventTarget {
		lang : string;
		continuous : boolean;
		interimResults : boolean;
		start() : void;
		stop() : void;
		onstart : (() => void) | null;
		onresult : ((event: SpeechRecognitionEvent) => void) | null;
		onerror : ((event: SpeechRecognitionErrorEvent) => void) | null;
		onend : (() => void) | null;
	}

	interface SpeechRecognitionEvent extends Event {
		results : SpeechRecognitionResultList;
		resultIndex : number;
	}

	interface SpeechRecognitionResultList {
		readonly length : number;
		item(index : number) : SpeechRecognitionResult;
	}

	interface SpeechRecognitionResult {
		readonly length : number;
		item(index : number) : SpeechRecognitionAlternative;
	}

	interface SpeechRecognitionAlternative {
		readonly transcript : string;
		readonly confidence : number;
	}

	interface SpeechRecognitionErrorEvent extends Event {
		error : string;
		message : string;
	}

	interface Window {
		SpeechRecognition : {
			prototype : SpeechRecognition;
			new () : SpeechRecognition;
		} | undefined;
		webkitSpeechRecognition : {
			prototype : SpeechRecognition;
			new () : SpeechRecognition;
		} | undefined;
	}
}

class Voice_Input {
	input : SpeechRecognition | undefined = undefined;

	constructor() {
		const voice_input = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (voice_input) {
			this.input = new voice_input();
			this.input.continuous = true;
			this.input.onerror = (event: SpeechRecognitionErrorEvent) => {
				toast.error(event.error);
			}
		}
	};

	chk = () : boolean => {
		return this.input !== undefined;
	};

	result = (f : (arg : string) => Promise<void>) => {
		if (this.input)
			this.input.onresult = async (event: SpeechRecognitionEvent) => {
				await f(event.results[event.results.length - 1][0].transcript);
			};
	};

	start = () => {
		if (this.input) {
			try {
				// this.input.lang = 'zh-CN'
				this.input.start();
			} catch (e) {
				fs.write.log(e);
			}
		}
	};

	stop = () => {
		if (this.input) {
			try {
				this.input.stop();
			} catch (e) {
				fs.write.log(e);
			}
		}
	};
}

export default new Voice_Input();