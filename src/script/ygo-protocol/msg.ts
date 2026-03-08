import { Buffer, WithImplicitCoercion } from 'buffer';
class Msg {
	index = 0;
	content : Buffer;
	constructor (data : WithImplicitCoercion<ArrayLike<number>>) {
		this.content = Buffer.from(data);
	};
	length = () : number => this.content.length;
	read = {
		uint8 : () : number | undefined => {
			if (this.index + 1 >= this.length())
				return undefined
			const data = this.content.readUint8(this.index);
			this.index ++;
			return data;
		},
		uint16 : () : number | undefined => {
			if (this.index + 2 >= this.length())
				return undefined
			const data = this.content.readUint16BE(this.index);
			this.index += 2;
			return data;
		},
		uint32 : () : number | undefined => {
			if (this.index + 4 >= this.length())
				return undefined
			const data = this.content.readUint32BE(this.index);
			this.index += 4;
			return data;
		}
	};
	slice = (len : number, start ?: number) : Msg | undefined => {
		start = start ?? this.index;
		if (this.index + len >= this.length())
			return undefined
		this.index += len;
		return new Msg(this.content.subarray(start, len));
	};
	to_end = () : Msg => new Msg(this.index >= this.length() ? Buffer.from([])
		: this.content.subarray(this.index));
	concat = (data : WithImplicitCoercion<ArrayLike<number>>) : Msg => new Msg(Buffer.concat([this.content, Buffer.from(data)]));
	buffer = () : Uint8Array => new Uint8Array(this.content.buffer);
	array = () : Array<number> => Array.from(this.content);
};
export default Msg;