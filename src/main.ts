import _ from 'lodash';
import * as c from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import * as normalChara from 'chara.normal';
import * as contextCalc from 'context_calc';
import * as spawn from 'spawn';
import * as wroom from 'wrap.room';
import * as roleTower from 'role.tower';
import { ErrorMapper } from 'utils/ErrorMapper';

const preLog = ' [main]     ';

export const loop = ErrorMapper.wrap(() => {
  const cx = contextCalc.calc();
  // R.u.safely(() => wroom.safemode(Game.spawns.pyon.room));
  LG.safely(() => spawn.tick(cx));

  for (const ts of cx.towers) {
    for (const tower of ts) {
      LG.safely(() => {
        roleTower.tick(cx, tower);
      });
    }
  }

  /*
  LG.safely(() => {
    if(Game.creeps.claimer_) {
      const creep = Game.creeps.claimer_;
      if(creep.room.name === 'W51S52') {
        creep.moveTo(creep.pos.findClosestByRange(FIND_EXIT_LEFT));
      } else {
        const err = creep.claimController(creep.room.controller);
        LG.println(preLog, err);
        if(err === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    }
  });
  */

  LG.safely(() => {
    // creepsManager.tick(cx);
    _.forEach(cx.r, (cxr, room) => {
      if (!cxr) return;

      for (const chara of cxr.myCharas) {
        LG.safely(() => {
          normalChara.tick(cx, chara);
        });
      }
    });
  });

  if (cx.flags.debug) LG.safely(() => contextCalc.log(contextCalc.calc()));

  LG.safely(() => LG.tickEnd(cx));
});
