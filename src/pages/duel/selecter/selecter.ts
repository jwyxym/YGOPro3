import Client_Card from '../scene/client_card';
import Plaid from '../scene/plaid';

class Base {
	show = false;
	cancelable = false;
	min = 0;
	max = 0;
	title = '';
}
class Cards extends Base {
	cards : Array<Client_Card> = [];
};
class Group extends Base {
	select : Array<Client_Card> = [];
	unselect : Array<Client_Card> = [];
};
class Confirm extends Base {
	message = '';
	chk = true;
	confirm = undefined as undefined | Function;
	cancel = undefined as undefined | Function;
};
class Codes extends Base {
	codes : Array<number> = [];
};
class Plaids extends Base {
	plaids : Array<Plaid> = [];
	cards : Array<Client_Card | undefined> = [];
};
export { Cards, Group, Confirm, Codes, Plaids };