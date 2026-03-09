import { Buffer, WithImplicitCoercion } from 'buffer';
class Msg {
	index : number;
	content : Buffer;
	readonly : boolean;
	constructor (data ?: WithImplicitCoercion<ArrayLike<number>> | string) {
		this.index = 0;
		[this.content, this.readonly] = data === undefined ? [Buffer.alloc(256), false]
			: [Buffer.from(data), true];
	};
	length = () : number => this.content.length;
	read = {
		uint8 : () : number | undefined => {
			if (this.index + 1 >= this.length())
				return undefined;
			const data = this.content.readUint8(this.index);
			this.index ++;
			return data;
		},
		uint16 : () : number | undefined => {
			if (this.index + 2 >= this.length())
				return undefined;
			const data = this.content.readUint16LE(this.index);
			this.index += 2;
			return data;
		},
		uint32 : () : number | undefined => {
			if (this.index + 4 >= this.length())
				return undefined;
			const data = this.content.readUint32LE(this.index);
			this.index += 4;
			return data;
		},
		str : (len : number) : string | undefined => {
			if (this.index + len >= this.length())
				return undefined;
			const data = this.content.toString('utf16le', this.index, this.index + len);
			this.index += len;
			return data;
		}
	};
	write = {
		uint8 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index + 1 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUInt8(data, this.index);
			this.index ++;
			return this;
		},
		uint16 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index + 1 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUint16LE(data, this.index);
			this.index += 2;
			return this;
		},
		uint32 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index + 1 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUInt32LE(data, this.index);
			this.index += 4;
			return this;
		},
		str : (str : string) : Msg => {
			if (this.readonly)
				return this;
			const data = Buffer.from(str, 'utf16le');
			this.content = Buffer.concat([this.content.subarray(0, this.index), data, Buffer.alloc(256)]);
			this.index += data.length;
			return this;
		}
	};
	slice = (len : number, start ?: number) : Msg | undefined => {
		start = start ?? this.index;
		if (this.index + len >= this.length())
			return undefined;
		this.index += len;
		return new Msg(this.content.subarray(start, len));
	};
	to_end = () : Msg => new Msg(this.index >= this.length() ? Buffer.from([])
		: this.content.subarray(this.index));
	to_index = () : Msg => new Msg(this.content.subarray(0, this.index));
	concat = (data : WithImplicitCoercion<ArrayLike<number>> | Msg) : Msg => new Msg(Buffer.concat([this.content, data instanceof Msg ? data.content : Buffer.from(data)]));
	buffer = () : Uint8Array => new Uint8Array(this.content.buffer);
	array = () : Array<number> => Array.from(this.content);
};
export default Msg;