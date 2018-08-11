import * as C from 'consts';
import * as LG from 'wrap.log';

export type Chara = Creep & { name: C.CharaName };

export function isChara(c: Creep): c is Chara {
  return C.isValidCharaName(c.name);
}

export function logFormat(c: Chara) {
  return LG.bg(C.charaBGs[c.name] || 'inherit',
    LG.color(C.charaColors[c.name] || 'inherit', c.name));
}
