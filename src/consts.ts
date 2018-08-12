import _ from 'lodash';

export const roles = {
  CHARGE: 1,
  UP: 2,
  BUILD: 3,
};
export const NormalCharaStates = {
  GAIN_SRC: 1,
  WORK_SPAWN: 2,
  WORK_BUILD: 3,
  WORK_UP: 4,
  WORK_TOWER: 5,
};

export const NormalCharaStateToShortName: {
  [NCS in number]: string;
} = {
  [NormalCharaStates.GAIN_SRC]: '給',
  [NormalCharaStates.WORK_SPAWN]: '湧',
  [NormalCharaStates.WORK_BUILD]: '建',
  [NormalCharaStates.WORK_UP]: '昇',
  [NormalCharaStates.WORK_TOWER]: '塔',
};

const charas = {
  心愛: true, 智乃: true, 理世: true, 千夜: true, 紗路: true,
  ティッピー: true, モカ: true, ワイルドギース: true, 麻耶: true, 恵: true,
  忍: true, アリス: true, 綾: true, 陽子: true, カレン: true,
  穂乃花: true,
  ゆずこ: true, 縁: true, 唯: true,
  千穂: true, 佳: true, ふみ: true,
  あかり: true, 京子: true, 結衣: true, ちなつ: true,
  綾乃: true, 千歳: true, 櫻子: true, 向日葵: true,
  りせ: true, あかね: true, まり: true, ともこ: true,
  撫子: true, 花子: true, 楓: true,
};

export type CharaName = keyof typeof charas;

export const charaNames = Object.keys(charas) as Array<CharaName>;

export function isValidCharaName(s: string): s is CharaName {
  return charas.hasOwnProperty(s);
}

export const charaColors: {
  [cn in CharaName]: string;
} = {
  心愛: '#f96', 智乃: '#abf', 理世: '#a1f', 千夜: '#173', 紗路: '#fc3',
  ティッピー: '#ffe', モカ: '#f87', ワイルドギース: '#93f', 麻耶: '#43c', 恵: '#f34',
  忍: '#371', アリス: '#fcf8bb', 綾: '#309', 陽子: '#d30', カレン: '#fefabc',
  穂乃花: '#775459',
  ゆずこ: '#f99', 縁: '#63c', 唯: '#ee3',
  千穂: '#600', 佳: '#600', ふみ: '#600',
  あかり: '#f34', 京子: '#cc0', 結衣: '#310', ちなつ: '#faa',
  綾乃: '#a76b85', 千歳: '#e0dbe1', 櫻子: '#d0baa2', 向日葵: '#32a',
  りせ: 'black', あかね: '#f34', まり: '#310', ともこ: '#faa',
  撫子: '#d8b2a3', 花子: '#8d6b62', 楓: '#788698',
};

export const charaBGs: {
  [cn in CharaName]: string;
} = {
  心愛: '#000', 智乃: '#000', 理世: '#feb', 千夜: '#000', 紗路: '#518',
  ティッピー: '#000', モカ: '#000', ワイルドギース: '#000', 麻耶: '#000', 恵: '#000',
  忍: '#000', アリス: '#000', 綾: '#000', 陽子: '#000', カレン: '#000',
  穂乃花: '#ddd',
  ゆずこ: '#000', 縁: '#edd', 唯: '#000',
  千穂: '#bbb', 佳: '#bbb', ふみ: '#bbb',
  あかり: '#000', 京子: '#000', 結衣: '#ccc', ちなつ: '#000',
  綾乃: '#000', 千歳: '#000', 櫻子: '#000', 向日葵: '#000',
  りせ: '#ccc', あかね: '#000', まり: '#ccc', ともこ: '#000',
  撫子: '#000', 花子: '#000', 楓: '#000',
};
