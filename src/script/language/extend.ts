import { COYOTE_WAVEFORM, COYOTE_WAVEFORMS } from 'dglab-kit';
import mainGame from '@/script/game';
import * as CONSTANT from '@/script/constant';

type DGLAB_LANGUAGE = 'cn' | 'tw' | 'en' | 'ja' | 'ko';

const DGLAB_WAVEFORM_EXTEND : Record<COYOTE_WAVEFORM, Record<Exclude<DGLAB_LANGUAGE, 'cn' | 'en'>, string>> = {
	[COYOTE_WAVEFORM.EXTRUSTION] : { tw : '擠壓', ja : '圧迫', ko : '압착' },
	[COYOTE_WAVEFORM.BUBBLE] : { tw : '氣泡', ja : '気泡', ko : '기포' },
	[COYOTE_WAVEFORM.RHYTHM] : { tw : '律動', ja : 'リズム', ko : '율동' },
	[COYOTE_WAVEFORM.AIR_WAVES] : { tw : '電波', ja : '電波', ko : '전파' },
	[COYOTE_WAVEFORM.DANCE] : { tw : '舞步', ja : 'ステップ', ko : '스텝' },
	[COYOTE_WAVEFORM.CLIMB] : { tw : '攀登', ja : 'クライム', ko : '등반' },
	[COYOTE_WAVEFORM.SHADE] : { tw : '樹蔭', ja : '木陰', ko : '나무 그늘' },
	[COYOTE_WAVEFORM.PULSE] : { tw : '脈衝', ja : 'パルス', ko : '펄스' },
	[COYOTE_WAVEFORM.BREATHING] : { tw : '呼吸', ja : '呼吸', ko : '호흡' },
	[COYOTE_WAVEFORM.TIDE] : { tw : '潮汐', ja : '潮汐', ko : '조석' },
	[COYOTE_WAVEFORM.PULSATING] : { tw : '連擊', ja : '連撃', ko : '연격' },
	[COYOTE_WAVEFORM.QUICK_RUB] : { tw : '快速按捏', ja : 'クイック揉み', ko : '빠른 주무르기' },
	[COYOTE_WAVEFORM.GRADUALRUB] : { tw : '按捏漸強', ja : '揉み上げ', ko : '점진적 주무르기' },
	[COYOTE_WAVEFORM.HEARTBEAT] : { tw : '心跳節奏', ja : '心拍リズム', ko : '심장 박동' },
	[COYOTE_WAVEFORM.COMPRESS] : { tw : '壓縮', ja : '圧縮', ko : '압축' },
	[COYOTE_WAVEFORM.RHYTHMIC] : { tw : '節奏步伐', ja : 'リズミック', ko : '리드미컬' },
	[COYOTE_WAVEFORM.GRAINY] : { tw : '顆粒摩擦', ja : '粒状摩擦', ko : '입자 마찰' },
	[COYOTE_WAVEFORM.BOUNCY] : { tw : '漸變彈跳', ja : '弾むグラデーション', ko : '점진적 바운스' },
	[COYOTE_WAVEFORM.RIPPLE] : { tw : '波浪漣漪', ja : '波紋', ko : '물결' },
	[COYOTE_WAVEFORM.RAINFALL] : { tw : '雨水沖刷', ja : '雨の洗い流し', ko : '빗물 세척' },
	[COYOTE_WAVEFORM.TEMPO_TAP] : { tw : '變速敲擊', ja : 'テンポタップ', ko : '템포 탭' },
	[COYOTE_WAVEFORM.SIGNAL] : { tw : '信號燈', ja : '信号', ko : '신호등' },
	[COYOTE_WAVEFORM.TEASE_1] : { tw : '挑逗1', ja : 'ティーズ1', ko : '자극 1' },
	[COYOTE_WAVEFORM.TEASE_2] : { tw : '挑逗2', ja : 'ティーズ2', ko : '자극 2' },
};

const I18N_DGLAB_MAP = (language : DGLAB_LANGUAGE) : Map<string, string> => {
	return new Map<string, string>(
		Object.entries(COYOTE_WAVEFORMS)
			.map(i => [
				i[0],
				language === 'cn' || language === 'en'
					? i[1].label[language]
					: DGLAB_WAVEFORM_EXTEND[i[0] as COYOTE_WAVEFORM][language]
			])
	);
};

const I18N_DGLAB = () : Map<string, string> => {
	switch (mainGame.get.system(CONSTANT.KEYS.I18N)) {
		case CONSTANT.LANGUAGE.Zh_CN:
			return I18N_DGLAB_MAP('cn');
		case CONSTANT.LANGUAGE.Zh_TW:
			return I18N_DGLAB_MAP('tw');
		case CONSTANT.LANGUAGE.En_US:
			return I18N_DGLAB_MAP('en');
		case CONSTANT.LANGUAGE.Ja_JP:
			return I18N_DGLAB_MAP('ja');
		case CONSTANT.LANGUAGE.Ko_KR:
			return I18N_DGLAB_MAP('ko');
	}
	return I18N_DGLAB_MAP('en');
};

export { I18N_DGLAB };
