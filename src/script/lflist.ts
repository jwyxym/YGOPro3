class LFList {
	hash : number;
	genesys : number;
	lflist : Map<number, number>;
	glist : Map<number, number>;
	constructor (obj : {
		hash : number;
		genesys : number;
		lflist : Array<[number, number]>;
		glist : Array<[number, number]>;
	}) {
		this.hash = obj.hash;
		this.genesys = obj.genesys;
		this.lflist = new Map(obj.lflist);
		this.glist = new Map(obj.glist);
	}
}

export default LFList;