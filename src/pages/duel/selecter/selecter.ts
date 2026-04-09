import Client_Card from '../scene/client_card';
import Plaid from '../scene/plaid';

class Base {
	show = false;
	confirm ?: ((...args : any[]) => Promise<void>);
}
class Cards extends Base {
	cards : Array<Client_Card> = [];
	cancelable = false;
	min = 0;
	max = 0;
	title = '';
};
class Group extends Base {
	select : Array<Client_Card> = [];
	unselect : Array<Client_Card> = [];
	cancelable = false;
	min = 0;
	max = 0;
	title = '';
};
class Confirm extends Base {
	message = '';
	chk = true;
	title = '';
};
class Codes extends Base {
	codes : Array<number> = [];
	cancelable = false;
	min = 0;
	max = 0;
	title = '';
};
class Plaids extends Base {
	plaids : Array<Plaid> = [];
	cards : Array<Client_Card | undefined> = [];
	cancelable = false;
	min = 0;
	title = '';
};
class Number extends Base {
	array : Array<number> = [];
	title = '';
};
class Option extends Base {
	array : Array<string> = [];
	cancelable = false;
	title = '';
};
class Race extends Base {
	available = 0;
	count = 0;
	title = '';
};
class Attribute extends Base {
	available = 0;
	count = 0;
	title = '';
};
class Pos extends Base {
	pos = 0;
	id  = 0;
	title = '';
};
export { Cards, Group, Confirm, Codes, Plaids, Number, Option, Race, Attribute, Pos };