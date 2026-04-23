import YGOProDeck, { YGOProDeckLike } from 'ygopro-deck-encode';
import { REG } from '@/script/constant';
import { I18N_KEYS } from '@/script/language/i18n';
import mainGame from '@/script/game';

class Deck extends YGOProDeck {
	new : boolean;
	constructor(init: Partial<YGOProDeckLike> = {}, is_new : boolean = false) {
		super(init);
		this.new = is_new;
	};

	set_name = (name : string) : Deck => {
		this.name = name;
		return this;
	}

	is_new = () : void => {
		this.new = true;
	}

	is_not_new = () : void => {
		this.new = false;
	}

	toYdkString () {
		return [
		'#created by YGOPro3',
		'#main',
		...this.main.map((id) => id.toString()),
		'#extra',
		...this.extra.map((id) => id.toString()),
		'!side',
		...this.side.map((id) => id.toString()),
		].join('\n');
	};


	static fromYdkString (str: string, input : boolean = false) : Deck {
		const lines = str.split(input ? ' ' : REG.LINE_FEED);
		const deck = new Deck();
		try {
			let current = deck.main;
			for (const _line of lines) {
				const line = _line.trim();
				if (line === '#main') {
					current = deck.main;
				}
				if (line === '#extra') {
					current = deck.extra;
				}
				if (line === '!side') {
					current = deck.side;
				}
				if (line.match(REG.NUMBER)) {
					current.push(parseInt(line, 10));
				}
			}
		} catch (e) {
			mainGame.log.write(mainGame.get.text(I18N_KEYS.DECK_INPUT_ERROR))
			return new Deck();
		}
		return deck;
	}

	static fromYGOMobileDeckURL (str: string) : Deck {
		try {
			const deck = YGOProDeck.fromYGOMobileDeckURL(str);
			return new Deck({
				main : deck.main,
				side : deck.side,
				extra : deck.extra,
				name : deck.name
			})
		} catch (e) {
			mainGame.log.write(mainGame.get.text(I18N_KEYS.DECK_INPUT_ERROR))
			return new Deck();
		}
	}
}

export default Deck;