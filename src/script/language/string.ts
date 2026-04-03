class YGOPRO_STR {
	content : string;
	constructor (str : string) {
		this.content = str;
	}
	toString = (replace : string | number | Array<string> | Array<number> | Array<string | number> = []) : string => {
		replace = (typeof replace === 'object' ? replace : [replace]) as Array<string | number>;
		let result = this.content;
		replace.forEach(i => {
			i = String(i);
			if (i.length > 0)
				result = result.replace('{:?}', i);
		});
		return result;
	}
}

export default YGOPRO_STR;