import _ from 'lodash';
import * as c from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import * as normalChara from 'chara.normal';
import * as contextCalc from 'context_calc';
import * as spawn from 'spawn';
import * as wroom from 'wrap.room';
import * as roleTower from 'role.tower';
import * as charaMoveManager from 'chara/manage.move';
import { ErrorMapper } from 'utils/ErrorMapper';

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

      for(const chara of cxr.myCharas) {
        LG.safely(() => {
          normalChara.tick(cx, chara);
        });
      }
    });
  });

  LG.safely(() => charaMoveManager.tickEnd(cx));

  if(cx.flags.debug) LG.safely(() => contextCalc.log(contextCalc.calc()));

  LG.safely(() => LG.tickEnd(cx));
});
