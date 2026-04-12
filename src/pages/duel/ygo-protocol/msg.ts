import { Buffer } from 'buffer';
class Msg {
	index : number;
	content : Buffer;
	readonly : boolean;
	constructor (data ?: Buffer | ArrayBuffer | Uint8Array | Array<number> | string) {
		this.index = 0;
		[this.content, this.readonly] = data === undefined ? [Buffer.alloc(256), false]
			: [Buffer.from(data as any), true];
	};
	length = () : number => this.content.length;
	read = {
		uint8 : () : number | undefined => {
			if (this.index >= this.length())
				return undefined;
			const data = this.content.readUInt8(this.index);
			this.index ++;
			return data;
		},
		uint16 : () : number | undefined => {
			if (this.index + 1 >= this.length())
				return undefined;
			const data = this.content.readUInt16LE(this.index);
			this.index += 2;
			return data;
		},
		uint32 : () : number | undefined => {
			if (this.index + 2 >= this.length())
				return undefined;
			const data = this.content.readUInt32LE(this.index);
			this.index += 4;
			return data;
		},
		str : (len ?: number) : string | undefined => {
			const length = this.length();

			if (len !== undefined && (len < 0 || this.index + len > length || len & 1))
				return undefined;

			const end = len ? this.index + len : length;
			const chars : Array<string> = [];

			for (let i = this.index; i < end; i += 2) {
				const code = this.content.readUInt16LE(i);
				if (code > 0x1F)
					chars.push(String.fromCharCode(code));
			}

			this.index = end;
			return chars.join('');
		}
	};
	write = {
		uint8 : (data : number) : Msg => {
			if (data < 0)
				return this.write.int8(data);
			if (this.readonly)
				return this;
			if (this.index >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUInt8(data, this.index);
			this.index ++;
			return this;
		},
		uint16 : (data : number) : Msg => {
			if (data < 0)
				return this.write.int16(data);
			if (this.readonly)
				return this;
			if (this.index + 1 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUInt16LE(data, this.index);
			this.index += 2;
			return this;
		},
		uint32 : (data : number) : Msg => {
			if (data < 0)
				return this.write.int32(data);
			if (this.readonly)
				return this;
			if (this.index + 3 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUInt32LE(data, this.index);
			this.index += 4;
			return this;
		},
		int8 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeInt8(data, this.index);
			this.index ++;
			return this;
		},
		int16 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index + 3 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeInt16LE(data, this.index);
			this.index += 2;
			return this;
		},
		int32 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index + 3 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeInt32LE(data, this.index);
			this.index += 4;
			return this;
		},
		str : (str : string, len ?: number) : Msg => {
			if (this.readonly)
				return this;
			const data = Buffer.from(str, 'utf16le');
			this.content = Buffer.concat([this.content.subarray(0, this.index), data, Buffer.alloc(256)]);
			this.index += len ?? data.length + 2;
			return this;
		}
	};
	slice = (len : number, start ?: number) : Msg | undefined => {
		start = start ?? this.index;
		if (this.index + len > this.length())
			return undefined;
		this.index += len;
		return new Msg(this.content.subarray(start, this.index));
	};
	to_end = () : Msg => new Msg(this.index >= this.length() ? Buffer.from([])
		: this.content.subarray(this.index));
	concat = (data : Buffer | ArrayBuffer | Uint8Array | Array<number> | string | Msg) : Msg => new Msg(Buffer.concat([this.content, data instanceof Msg ? data.content : Buffer.from(data as any)]));
	buffer = () : Uint8Array => {
		const data = this.content.subarray(0, this.index);
		const msg = Buffer.alloc(data.length + 2);
		msg.writeUInt16LE(data.length, 0);
		Buffer.from(data).copy(msg, 2);
  		return new Uint8Array(msg.buffer, msg.byteOffset, msg.length);
	};
	array = () : Array<number> => Array.from(this.buffer());
};
export default Msg;