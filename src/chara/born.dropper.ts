import { Context } from 'context';
import { CharaDropper } from 'chara/born';
import { getEnergy } from 'chara/util';
import { registerMoveTo } from 'chara/manage.move';

export function tick(cx: Context, chara: CharaDropper): void {
  const cxr = cx.r[chara.room.name];
  if(!cxr) throw new Error(`unknown room: ${chara.room.name}`);

  const ene = cxr.sourceLikes.find(s => s.id === chara.memory.eneID);
  if(!ene) throw new Error(`unknown source-like: ${chara.memory.eneID}`);

  const err = getEnergy(cx, chara, ene);
  if(err == ERR_NOT_IN_RANGE) {
    registerMoveTo(cx, chara, ene);
  }
}
