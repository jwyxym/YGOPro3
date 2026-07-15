import dg from '@/script/dglab';
import { MSG } from './network';

const extend = new Map<number, Function>([]);
extend.set(MSG.DAMAGE, dg.happen);
extend.set(MSG.PAY_LPCOST, dg.happen);

export default extend;