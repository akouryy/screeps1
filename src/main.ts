import _ from 'lodash';
import * as c from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import * as charaNormal from 'chara/born.normal';
import * as charaDropper from 'chara/born.dropper';
import * as contextCalc from 'context';
import * as spawn from 'spawn';
import * as wroom from 'wrap.room';
import * as roleTower from 'role.tower';
import * as charaMoveManager from 'chara/manage.move';
import { ErrorMapper } from 'utils/ErrorMapper';
import { isCharaNormal, isCharaDropper } from 'chara/born';

const preLog = ' [main]     ';

export const loop = ErrorMapper.wrap(() => {
  const cx = contextCalc.calc();
  // R.u.safely(() => wroom.safemode(Game.spawns.pyon.room));
  LG.safely(() => charaMoveManager.tickBegin(cx));
  LG.safely(() => spawn.tick(cx));

  for(const ts of cx.towers) {
    for(const tower of ts) {
      LG.safely(() => {
        roleTower.tick(cx, tower);
      });
    }
  }

  LG.safely(() => {
    _.forEach(cx.r, (cxr, room) => {
      if(!cxr) return;

      for(const chara of cxr.charas) {
        LG.safely(() => {
          if(isCharaNormal(chara)) {
            charaNormal.tick(cx, chara);
          } else if(isCharaDropper(chara)) {
            charaDropper.tick(cx, chara);
          }
        });
      }
    });
  });

  LG.safely(() => charaMoveManager.tickEnd(cx));

  if(cx.flags.debug) LG.safely(() => contextCalc.log(contextCalc.calc()));

  LG.safely(() => LG.tickEnd(cx));
});
