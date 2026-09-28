import * as idb from 'idb';

import Deck from '@/pages/deck/deck';

class Getter<T> {
	db : idb.IDBPDatabase;
	key : string;
	constructor (db : idb.IDBPDatabase, key : string) {
		this.db = db;
		this.key = key;
	};

	get_all = async () : Promise<Array<[string, T]>> => (await this.db
		.getAll(this.key))
		.map(i => [i.key, i.value]);

	get = async (key : string) : Promise<T | undefined> => {
		const i = await this.db
			.get(this.key, key);
		return i?.value;
	};

	set = async (key : string, value : T) : Promise<IDBValidKey> => await this.db
		.put(this.key, { key, value });
}

class DB {
	db : idb.IDBPDatabase;
	system : {
		string : Getter<string>;
		bool : Getter<boolean>;
		number : Getter<number>;
		array : Getter<Array<string>>;
	};
	textures : Getter<Blob>;
	constructor (db : idb.IDBPDatabase) {
		this.db = db;
		const string = new Getter<string>(db, 'system:string');
		const bool = new Getter<boolean>(db, 'system:bool');
		const number = new Getter<number>(db, 'system:number');
		const array = new Getter<Array<string>>(db, 'system:array');
		this.textures = new Getter<Blob>(db, 'textures');
		this.system = {
			string, bool, number, array
		};
	};

	static new = async () : Promise<DB> => {
		const key = { keyPath : 'key' };
		const db = await idb.openDB('ygopro3', 1, {
			upgrade : (db) => {
				db.createObjectStore('system:string', key);
				db.createObjectStore('system:bool', key);
				db.createObjectStore('system:number', key);
				db.createObjectStore('system:array', key);
				db.createObjectStore('textures', key);
				db.createObjectStore('deck', key);
			}
		});
		return new DB(db);
	};

	deck = {
		get_all : async () : Promise<Array<Deck>> => (await this.db
			.getAll('deck'))
			.map(i => {
				const deck = Deck.fromEncodedString(i.value);
				deck.name = i.key;
				return deck;
			}),
		get : async (name : string) : Promise<Deck> => Deck
			.fromEncodedString(await this.db
				.get('deck', name)
			),
		set : async (deck : Deck) : Promise<IDBValidKey> => await this.db
			.put('deck', {
				key : deck.name,
				value : deck.toEncodedString()
			}),
		del : async (name : string) : Promise<void> => await this.db
			.delete('deck', name)
	};
};

const db = await DB.new();
export default db;