interface Srv {
	priority : number;
	weight : number;
	port : number;
	target : string;
};

interface Spine {
	skeleton : string;
	atlas : string;
	img ?: Record<string, string>;
	animation ?: string;
};

export type {Srv, Spine};