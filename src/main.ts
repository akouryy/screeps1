import * as c from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import * as normalChara from 'chara.normal';
import * as contextCalc from 'context_calc';
import * as spawn from 'spawn';
import * as wroom from 'wrap.room';
import * as roleTower from 'role.tower';

const preLog = ' [main]     ';

export function loop() {
  const cx = contextCalc.calc();
  // R.u.safely(() => wroom.safemode(Game.spawns.pyon.room));
  R.u.safely(() => spawn.tick(cx));

  for(const ts of cx.towers) {
    for(const tower of ts) {
      R.u.safely(() => {
        roleTower.tick(cx, tower);
      });
    }
  }

  R.u.safely(() => {
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

  R.u.safely(() => {
    // creepsManager.tick(cx);
    for(const room of cx.rooms) {
      const cxr = cx.r[room.name];

      for(const creep of cxr.creeps) {
        R.u.safely(() => {
          normalChara.tick(cx, creep);
        });
      }
    }
  });

  if(cx.debug) R.u.safely(() => contextCalc.log(contextCalc.calc()));

  R.u.safely(() => LG.tickEnd(cx));
}
