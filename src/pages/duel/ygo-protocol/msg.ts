import { Buffer, WithImplicitCoercion } from 'buffer';
import { REG } from '@/script/constant';
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
			if (this.index >= this.length())
				return undefined;
			const data = this.content.readUint8(this.index);
			this.index ++;
			return data;
		},
		uint16 : () : number | undefined => {
			if (this.index + 1 >= this.length())
				return undefined;
			const data = this.content.readUint16LE(this.index);
			this.index += 2;
			return data;
		},
		uint32 : () : number | undefined => {
			if (this.index + 2 >= this.length())
				return undefined;
			const data = this.content.readUint32LE(this.index);
			this.index += 4;
			return data;
		},
		str : (len ?: number) : string | undefined => {
			if (len) {
				if (this.index + len - 1 >= this.length())
					return undefined;
				const data = this.content.toString('utf16le', this.index, this.index + len).replace(REG.STR, '');;
				this.index += len;
				return data;
			} else {
				const length = this.length();
				const data = this.content.toString('utf16le', this.index, length).replace(REG.STR, '');;
				this.index = length;
				return data;
			}
		}
	};
	write = {
		uint8 : (data : number) : Msg => {
			if (this.readonly)
				return this;
			if (this.index >= this.length())
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
			if (this.index + 3 >= this.length())
				this.content = Buffer.concat([this.content, Buffer.alloc(256)]);
			this.content.writeUInt32LE(data, this.index);
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
	concat = (data : WithImplicitCoercion<ArrayLike<number>> | Msg) : Msg => new Msg(Buffer.concat([this.content, data instanceof Msg ? data.content : Buffer.from(data)]));
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