interface Srv {
	priority : number;
	weight : number;
	port : number;
	target : string;
};

interface P2pSession {
	mode : 'host' | 'join';
	endpoint_id : string;
	room_code : string | null;
	local_address : string;
	running : boolean;
};

export default Srv;
export type { P2pSession };