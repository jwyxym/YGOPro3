import { all, create } from 'mathjs'

class Calculator {
	math = create(all);
	interval = (str : string, num : number) : boolean => {
		try {
			if (str.trimStart().startsWith('..')) str = `0${str}`;
			if (str.trimEnd().endsWith('..')) str += Number.MAX_SAFE_INTEGER;
			const nums = str.split('..');
			if (nums.length !== 2) return false;
			const [min, max] = nums;
			return this.math.evaluate(`${min}<=${num}<=${max}`);
		} catch {
			return false;
		}
	};

	compare = (str : string, num : number) : boolean => {
		try {
			str = str.trim();
			if (str.startsWith('=') && !str.startsWith('=='))
				str = `=${str.slice(1)}`;
			else if (!str.startsWith('=') && !str.startsWith('>') && !str.startsWith('<'))
				str = `==${str}`;
			return this.math.evaluate(`${num}${str}`);
		} catch {
			return false;
		}
	};
}

export default new Calculator();