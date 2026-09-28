import type Deck from '@/pages/deck/deck';
import type Card from '@/script/card';
import type LFList from '@/script/lflist';

abstract class BaseInvoke {
	abstract game : {
		init : () => Promise<boolean>;
		reload : (overwrite : boolean) => Promise<boolean>;
		time : (path : Array<string>) => Promise<Date | undefined>;
		version : () => Promise<string>;
		chk_version : () => Promise<boolean>;
		download : (url : string, name ?: string, chunk ?: number) => Promise<string>;
		set_system : (key : string, ct : number, value : string | number | boolean | Array<string>, write : boolean) => Promise<boolean>;
		set_textures : (key : string, value : string, content ?: Uint8Array | Blob) => Promise<boolean>;
		get_srv : (url : string) => Promise<string>;
		get_pic : (deck : Array<number>) => Promise<Array<[number, string]>>;
		get_sound : () => Promise<Array<[string, string]>>;
		get_textures : () => Promise<{
			ot : Map<number, string>,
			attribute : Map<number, string>,
			category : Map<number, string>,
			race : Map<number, string>,
			types : Map<number, string>,
			counter : Map<number, string>,
			link : Map<number, [string, string]>,
			info : Map<string, string>,
			other : Map<string, string>,
			btn : Map<string, [string, string]>,
			avatar : Array<string>,
		}>;
		get_cards : () => Promise<Array<[number, Card]>>;
		get_system : () => Promise<{
			string : Map<string, string>,
			bool : Map<string, boolean>,
			number : Map<string, number>,
			array : Map<string, Array<string>>,
		}>;
		get_server : () => Promise<Array<[string, string]>>;
		get_lflist : () => Promise<Array<[string, LFList]>>;
		get_strings : () => Promise<{
			system : Map<number, string>,
			victory : Map<number, string>,
			counter : Map<number, string>,
			setname : Map<number, string>
		}>;
		get_info : (i18n : string) => Promise<{
			ot : Array<[number, string]>;
			attribute : Array<[number, string]>;
			link : Array<[number, string]>;
			category : Array<[number, string]>;
			race : Array<[number, string]>;
			types : Array<[number, string]>;
		}>;
		get_room : () => Promise<Array<[string, string]>>;
		get_script : (id : number) => Promise<string>;
		get_hash : () => Promise<ArrayBuffer | undefined>;
	};

	abstract deck : {
		get : () => Promise<Array<Deck>>;
		write : (name : string, deck : string) => Promise<boolean>;
		rename : (old_name : string, new_name : string) => Promise<boolean>;
		del : (name : string) => Promise<boolean>;
	};

	abstract ypk : {
		del : (name : string) => Promise<boolean>;
		exists : (name : string) => Promise<boolean>;
		get : () => Promise<Array<string>>;
		load : (name ?: string) => Promise<boolean | Array<string>>;
		unload : (name : string) => Promise<boolean>;
	};

	abstract server : {
		start : (i : {
			lflist : number;
			rule : number;
			mode : number;
			replayMode : number;
			duelRule : number;
			noCheckDeck : number;
			noShuffleDeck : number;
			startLp : number;
			startHand : number;
			drawCount : number;
			timeLimit : number;
		}) => Promise<number>;
		stop : () => Promise<boolean>;
	};

	abstract bot : {
		start : (args : string, deck : string) => Promise<void>;
		stop : () => Promise<boolean>;
		list : () => Promise<Array<[string, string, string]>>;
	};

	abstract replay : {
		read : (name : string | Blob) => Promise<Uint8Array>;
		save : (name : string, content : Uint8Array) => Promise<string | void>;
		list : () => Promise<Array<string>>;
		rename : (from : string, to : string) => Promise<boolean>;
		del : (name : string) => Promise<boolean>;
	};

	abstract js : {
		load : (name : string) => Promise<string | undefined>;
		unload : (name : string) => Promise<boolean>;
		call : <T>(name : string, args ?: Array<any>) => Promise<T | undefined>;
	};

	abstract plugin : {
		write : (name : string, content : string) => Promise<boolean>;
		read : (name : string) => Promise<string>;
	};

	abstract log : {
		write : (line : string) => Promise<boolean>;
	};
};

export default BaseInvoke;