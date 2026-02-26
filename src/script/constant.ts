import * as fs from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';

const SYSTEM = platform();

const BASE_DIR = SYSTEM == 'android' ? fs.BaseDirectory.Public : fs.BaseDirectory.Resource;
const BASE_PATH = SYSTEM == 'android' ? path.publicDir : path.resourceDir;
const LINE_FEED = SYSTEM == 'windows' ? '\r\n' : '\n';

const REG = {
	NAME : /[\\/]([^.]*)\./,
	FULL_NAME : /[\\/:*?"<>|]/,
	NUMBER_NAME : /[\\/](\d+)\./,
	DATABASE : /\.(cdb)$/i,
	PICTURE : /\.(jpg|png|jpeg)$/i,
	BGM : /\.(mp4|wav)$/i,
	CONF : /\.(conf)$/i,
	INI : /\.(ini)$/i,
	ZIP : /\.(ypk|zip)$/i,
	FONT : /\.(ttf)$/i,
	JSON : /\.(json)$/i,
	DECK : /\.(ydk)$/i,
	ATK : /^[0-9?\s<>=.]*$/,
	LV : /^[0-9<>=.]*$/,
	LINE_FEED : /\r?\n/,
	NUMBER : /^\d+$/
};

const LANGUAGE = {
	Zh_CN : 'zh-CN'
};

const FILES = {
	LFLIST_CONF : 'lflist.conf',
	SERVER_CONF : 'servers.conf',
	SYSTEM_CONF : 'system.conf',
	BACK_BGM : 'BACK_BGM',
	BATTLE_BGM : 'BATTLE_BGM',
	SUPER_PRE : 'ygopro-super-pre.ypk',
	PIC_ZIP : 'pics.zip',
	ASSETS_ZIP : 'assets.zip',
	TEXTURE_UNKNOW : 'unknown.jpg',
	TEXTURE_COVER : 'cover.jpg',
	TEXTURE_SPELL : 'attr_spell.png',
	TEXTURE_TRAP : 'attr_trap.png',
	TEXTURE_ATK : 'atk.png',
	TEXTURE_DEF : 'def.png',
	TEXTURE_RPS : ['s.png', 'r.png', 'p.png'],
	TEXTURE_INFO_TUNER : 'info_tuner.png',
	TEXTURE_INFO_LV : 'info_level.png',
	TEXTURE_INFO_RANK : 'info_rank.png',
	TEXTURE_INFO_LINK : 'info_link.png',
	TEXTURE_INFO_SCALE : 'info_scale.png',
	TEXTURE_INFO_OVERLAY : 'info_overlay.png',
	TEXTURE_INFO_LV_RANK_LINK : 'info_star_rank_link.png',
	TEXTURE_BTN_ACTIVATE : ['btn_activate.png', 'btn_hover_activate.png'],
	TEXTURE_BTN_ATTACK : ['btn_attack.png', 'btn_hover_attack.png'],
	TEXTURE_BTN_MSET : ['btn_mset.png', 'btn_hover_mset.png'],
	TEXTURE_BTN_SSET : ['btn_sset.png', 'btn_hover_sset.png'],
	TEXTURE_BTN_POS_ATTACK : ['btn_pos_attack.png', 'btn_hover_pos_attack.png'],
	TEXTURE_BTN_POS_DEFENCE : ['btn_pos_defence.png', 'btn_hover_pos_defence.png'],
	TEXTURE_BTN_FILP : ['btn_flip.png', 'btn_hover_flip.png'],
	TEXTURE_BTN_SCALE : ['btn_scale.png', 'btn_hover_scale.png'],
	TEXTURE_BTN_PSUMMON : ['btn_psummon.png', 'btn_hover_psummon.png'],
	TEXTURE_BTN_SPSUMMON : ['btn_spsummon.png', 'btn_hover_spsummon.png'],
	TEXTURE_BTN_SUMMON : ['btn_summon.png', 'btn_hover_summon.png'],
	TEXTURE_LINK_PIC : ['arrow-{:?}-off.png', 'arrow-{:?}-on.png'],
	TEXTURE_BACK : ['backI.jpg', 'backII.jpg'],
	TEXTURE_DECK : ['deck.png', 'deck_ex.png'],
	STRING_CONF : new Map([
		['', 'strings.conf'],
		[LANGUAGE.Zh_CN, 'strings-zh-CN.conf']
	]) as Map<string, string>,
	INFO_CONF : new Map([
		['', 'info.conf'],
		[LANGUAGE.Zh_CN, 'cardinfo-zh-CN.conf']
	]) as Map<string, string>,
	DB : new Map([
		[LANGUAGE.Zh_CN, 'cards-zh-CN.cdb']
	]) as Map<string, string>,
};

const URL = {
	DECK_SHARE : 'http://deck.ourygo.top',
	SUPER_PRE : 'https://cdn02.moecube.com:444/ygopro-super-pre/archive/ygopro-super-pre.ypk',
	SUPER_PRE_VERSION : 'https://cdn02.moecube.com:444/ygopro-super-pre/data/version.txt',
	ASSETS : new Map([
		['https://gitcode.com/', SYSTEM === 'android' ?
			'https://api.gitcode.com/api/v5/repos/jwyxym/tauri-ygo/releases/release-latest/attach_files/assets_android.zip/download' :
			'https://api.gitcode.com/api/v5/repos/jwyxym/tauri-ygo/releases/release-latest/attach_files/assets.zip/download'
		],
		['https://github.com/', SYSTEM === 'android' ?
			'https://github.com/jwyxym/tauri-ygo/releases/download/assets-latest/assets_android.zip' :
			'https://github.com/jwyxym/tauri-ygo/releases/download/assets-latest/assets.zip'
		]
	]),
	VERSION : 'https://web-api.gitcode.com/api/v2/projects/jwyxym%2Ftauri-ygo/releases?repoId=jwyxym%252Ftauri-ygo',
	VERSION_HEAD : [['Referer', 'https://gitcode.com/']] as Array<[string, string]>,
	MYCARD_NEWS : 'https://sapi.moecube.com:444/apps.json',
	NEWS_URL : 'https://ygobbs2.com/t/'
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
	SETTING_CT_DECK_MAIN : 'CT_DECK_MAIN',
	SETTING_CT_DECK_EX : 'CT_DECK_EX',
	SETTING_CT_DECK_SIDE : 'CT_DECK_SIDE',
	SETTING_CT_CARD : 'CT_CARD',
	SETTING_VOICE_BACK_BGM : 'BACK_BGM',
	SETTING_LOADING_EXPANSION : 'LOADING_EXPANSION',
	SETTING_SERVER_ADDRESS : 'SERVER_ADDRESS',
	SETTING_SERVER_PLAYER_NAME : 'SERVER_PLAYER_NAME',
	SETTING_SERVER_PASS : 'SERVER_PASS',
	SETTING_DOWMLOAD_TIME : 'DOWMLOAD_TIME',
	SETTING_AVATAR : 'AVATAR',
	SETTING_SELECT_SORT : 'SELECT_SORT',
	SETTING_SELECT_SLIDER : 'SELECT_SLIDER',
	SETTING_SELECT_VOICE : 'SELECT_VOICE'
};

export { REG, FILES, LANGUAGE, URL, KEYS, BASE_DIR, BASE_PATH, LINE_FEED, SYSTEM };