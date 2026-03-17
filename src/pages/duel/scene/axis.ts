import { LOCATION } from '@/pages/duel/ygo-protocol/network';
import Client_Card from './client_card';
import * as SIZE from './scene-size';
import { duel } from './scene';

class Axis {
	x : number;
	y : number;
	z ?: number;

	constructor (x : number, y : number, z ?: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	};

	set = {
		x : (x : number) : Axis => { this.x = x; return this; },
		y : (y : number) : Axis => { this.y = y; return this; },
		z : (z : number) : Axis => { this.z = z; return this; },
	};

	get = {
		xyz : () : [number, number, number] => [this.x, this.y, this.z ?? 0]
	}

	static map : Map<number, Array<Axis>> = new Map([
		[LOCATION.HAND, [
			new Axis(- 2, - 3),
			new Axis(2, 3)
		]],
		[LOCATION.DECK, [
			new Axis(3, - 2),
			new Axis(- 3, 2)
		]],
		[LOCATION.EXTRA, [
			new Axis(- 3, - 2),
			new Axis(3, 2)
		]],
		[LOCATION.FZONE, [
			new Axis(- 3, - 1),
			new Axis(3, 1)
		]],
		[LOCATION.GRAVE, [
			new Axis(3, - 1),
			new Axis(- 3, 1)
		]],
		[LOCATION.REMOVED, [
			new Axis(3, 0),
			new Axis(- 3, 0)
		]],
		[LOCATION.MZONE | (0 << 16), [
			new Axis(- 2, - 1),
			new Axis(2, 1)
		]],
		[LOCATION.MZONE | (1 << 16), [
			new Axis(- 1, - 1),
			new Axis(1, 1)
		]],
		[LOCATION.MZONE | (2 << 16), [
			new Axis(0, - 1),
			new Axis(0, 1)
		]],
		[LOCATION.MZONE | (3 << 16), [
			new Axis(1, - 1),
			new Axis(- 1, 1)
		]],
		[LOCATION.MZONE | (4 << 16), [
			new Axis(2, - 1),
			new Axis(- 2, 1)
		]],
		[LOCATION.MZONE | (5 << 16), [
			new Axis(- 1, 0),
			new Axis(1, 0)
		]],
		[LOCATION.MZONE | (6 << 16), [
			new Axis(1, 0),
			new Axis(- 1, 0)
		]],
		[LOCATION.SZONE | (0 << 16), [
			new Axis(- 2, - 2),
			new Axis(2, 2)
		]],
		[LOCATION.SZONE | (1 << 16), [
			new Axis(- 1, - 2),
			new Axis(1, 2)
		]],
		[LOCATION.SZONE | (2 << 16), [
			new Axis(0, - 2),
			new Axis(0, 2)
		]],
		[LOCATION.SZONE | (3 << 16), [
			new Axis(1, - 2),
			new Axis(- 1, 2)
		]],
		[LOCATION.SZONE | (4 << 16), [
			new Axis(2, - 2),
			new Axis(- 2, 2)
		]],
		[LOCATION.PZONE | (0 << 16), [
			new Axis(- 2, - 2),
			new Axis(2, 2)
		]],
		[LOCATION.PZONE | (1 << 16), [
			new Axis(2, - 2),
			new Axis(- 2, 2)
		]]
	]);

	static computed = {
		card : (card : Client_Card) : Axis => {
			if (card.location === LOCATION.HAND) {
				const width = SIZE.WIDTH * SIZE.MAX_HAND;
				const axis : Axis = Axis.map.get(card.location)![card.owner];
				const ct = duel.get.cards(LOCATION.HAND).length;
				const x = (SIZE.HEIGHT + SIZE.GAP.HAND) * axis.x + Math.min(width / ct, SIZE.WIDTH) * card.seq * (!!card.owner ? -1 : 1);
				const y = (SIZE.HEIGHT + SIZE.GAP.HAND * 2) * axis.y;
				const z = card.seq * SIZE.GAP.HAND + (!!card.owner ? 0 : 60);
				return new Axis(x, y, z);
			} else {
				const loc = card.location & LOCATION.ONFIELD;
				const axis : Axis = Axis.map.get(loc ? (
					loc | (card.seq << 16)
				) : card.location)![card.owner];
				const x : number = (SIZE.HEIGHT + SIZE.GAP.SCENE) * axis.x;
				let y : number = (SIZE.HEIGHT + SIZE.GAP.SCENE) * axis.y
				const z : number  = (loc ? card.overlay : card.seq) * SIZE.TOP;
				if (axis.x % 3 === 0 && axis.x !== 0) {
					y += SIZE.OFFSET * 
						(axis.y > 0 ? 1
							: axis.y < 0 ? - 1
							: axis.x === - 3 ? 1 : - 1
						)
				}
				return new Axis(x, y, z);
			}
		},
		back : (axis : Axis) : Axis => {
			const x : number = (SIZE.HEIGHT + SIZE.GAP.SCENE) * axis.x;
			let y : number = (SIZE.HEIGHT + SIZE.GAP.SCENE) * axis.y
			if (axis.x % 3 === 0 && axis.x !== 0) {
				y += SIZE.OFFSET * 
					(axis.y > 0 ? 1
						: axis.y < 0 ? - 1
						: axis.x === - 3 ? 1 : - 1
					)
			}
			return new Axis(x, y, 0);
		},
	}
};

export default Axis;