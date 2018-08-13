import { SourceLike, Context } from 'context';
import { Chara } from 'wrap.chara';

export function getEnergy(cx: Context, chara: Chara, src: SourceLike): ScreepsReturnCode {
  if(src instanceof Source) {
    return chara.harvest(src);
  } else {
    return chara.withdraw(src, RESOURCE_ENERGY);
  }
}
