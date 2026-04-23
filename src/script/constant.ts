import * as fs from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';

const SYSTEM = platform();

const BASE_DIR = SYSTEM == 'android' ? fs.BaseDirectory.Public : fs.BaseDirectory.Resource;
const BASE_PATH = SYSTEM == 'android' ? path.publicDir : path.resourceDir;
const LINE_FEED = SYSTEM == 'windows' ? '\r\n' : '\n';

const REG = {
	NAME : /[<>:"/\\|?*\x00-\x1F]|^[\s.]|[\s.]$|\.$/g,
	ATK : /^[0-9?\s<>=.]*$/,
	LV : /^[0-9<>=.]*$/,
	LINE_FEED : /\r?\n/,
	NUMBER : /^\d+$/
};

const LANGUAGE = {
	Zh_CN : 'zh-CN'
};

const URL = {
	DECK_SHARE : 'http://deck.ourygo.top',
	SUPER_PRE : 'https://cdn02.moecube.com:444/ygopro-super-pre/archive/ygopro-super-pre.ypk',
	SUPER_PRE_VERSION : 'https://cdn02.moecube.com:444/ygopro-super-pre/data/version.txt',
	MYCARD_NEWS : 'https://sapi.moecube.com:444/apps.json',
	NEWS_URL : 'https://ygobbs2.com/t/',
	YGOPRO3 : 'https://github.com/jwyxym/YGOPro3/releases/release-latest'
}

const KEYS = {
	BOOL : 'BOOL',
	ARRAY : 'ARRAY',
	NUMBER : 'NUMBER',
	STRING : 'STRING',
	SYSTEM : 'SYSTEM',
	VICTORY : 'VICTORY',
	COUNTER : 'COUNTER',
	SETCODE : 'SETCODE',
	OT : 'OT',
	ATTRIBUTE : 'ATTRIBUTE',
	LINK : 'LINK',
	CATEGORY : 'CATEGORY',
	RACE : 'RACE',
	TYPE : 'TYPE',
	INFO : 'INFO',
	OTHER : 'OTHER',
	BTN : 'BTN',
	LEVEL : "LEVEL",
	OVERLAY : "OVERLAY",
	RANK : "RANK",
	SCALE : "SCALE",
	STAR_RANK_LINK : "STAR_RANK_LINK",
	TUNER : "TUNER",
	COVER : 'COVER',
	UNKNOWN : 'UNKNOWN',
	ACTIVATE : "ACTIVATE",
	ATTACK : "ATTACK",
	SUMMON : "SUMMON",
	SPSUMMON : "SPSUMMON",
	PSUMMON : "PSUMMON",
	FLIP : "FLIP",
	MSET : "MSET",
	SSET : "SSET",
	POS_ATTACK : "POS_ATTACK",
	POS_DEFENCE : "POS_DEFENCE",
	BACKI : 'BACKI',
	BACKII : 'BACKII',
	BACK_BGM : 'BACK_BGM',
	BATTLE_BGM : 'BATTLE_BGM',
	NA : 'N/A',
	S : 'S',
	R : 'R',
	P : 'P',
	I18N : 'I18N',
	SERVER_NAME : 'ServerName',
	SERVER_HOST : 'ServerHost',
	SERVER_PORT : 'ServerPort',
	SETTING_CHK_DELETE_YPK : 'DELETE_YPK',
	SETTING_CHK_DELETE_DECK : 'DELETE_DECK',
	SETTING_CHK_EXIT_DECK : 'EXIT_DECK',
	SETTING_CHK_SORT_DECK : 'SORT_DECK',
	SETTING_CHK_DISRUPT_DECK : 'DISRUPT_DECK',
	SETTING_CHK_CLEAR_DECK : 'CLEAR_DECK',
	SETTING_CHK_SWAP_BUTTON : 'SWAP_BUTTON',
	SETTING_CHK_HIDDEN_NAME : 'HIDDEN_NAME',
	SETTING_CHK_HIDDEN_CHAT : 'HIDDEN_CHAT',
	SETTING_CHK_SURRENDER : 'SURRENDER',
	SETTING_CHK_EXIT_SERVER : 'EXIT_SERVER',
	SETTING_CT_DECK_MAIN : 'CT_DECK_MAIN',
	SETTING_CT_DECK_EX : 'CT_DECK_EX',
	SETTING_CT_DECK_SIDE : 'CT_DECK_SIDE',
	SETTING_CT_CARD : 'CT_CARD',
	SETTING_AVATAR_SELF : 'CT_AVATAR_SELF',
	SETTING_AVATAR_OPPO : 'CT_AVATAR_OPPO',
	SETTING_AVATAR_SERVER : 'CT_AVATAR_SERVER',
	SETTING_VOICE : 'CT_VOICE',
	SETTING_LOADING_EXPANSION : 'LOADING_EXPANSION',
	SETTING_SERVER_ADDRESS : 'SERVER_ADDRESS',
	SETTING_SERVER_PLAYER_NAME : 'SERVER_PLAYER_NAME',
	SETTING_SERVER_PASS : 'SERVER_PASS',
	SETTING_DOWMLOAD_TIME : 'DOWMLOAD_TIME',
	SETTING_SELECT_SORT : 'SELECT_SORT',
	SETTING_SELECT_SLIDER : 'SELECT_SLIDER',
	SETTING_SELECT_VOICE : 'SELECT_VOICE'
};

export { REG, LANGUAGE, URL, KEYS, BASE_DIR, BASE_PATH, LINE_FEED, SYSTEM };