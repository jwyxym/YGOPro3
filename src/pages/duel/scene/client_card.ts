class Client_Card {
	location : number;
	owner : number;
	seq : number;

	constructor (location : number, owner : number, seq : number) {
		this.location = location;
		this.owner = owner;
		this.seq = seq;
	}
};

export default Client_Card;