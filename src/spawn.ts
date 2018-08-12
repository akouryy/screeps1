import _ from 'lodash';
import * as c from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import { Context } from 'context_calc';

const preLog = LG.color('#c99', ' [spn]      ');

export function tick(cx: Context) {
  clearMemory(cx);
  LG.safely(() => {
    for(const room of cx.rooms) {
      const cxr = cx.r[room.name];
      if(cxr !== undefined && cxr.creeps.length < 10) {
        spawn(cx, room, {
          [c.roles.CHARGE]: 0.3,
          [c.roles.UP]: 0.4,
          [c.roles.BUILD]: 0.3,
        });
      }
    }
  });
}

export function clearMemory(cx: Context) {
  for(const name in Memory.creeps) {
    if(!Game.creeps[name]) {
      delete Memory.creeps[name];
      LG.println(preLog, `Cremated ${name}.`);
    }
  }
}

export function spawn(cx: Context, room: Room, rolePs: { [R in number]: number | undefined }) {
  if(room !== Game.spawns.pyon.room) return;
  if(cx.flags.stopSpawn) return;
  const cxr = cx.r[room.name];
  if(!cxr) return;

  const eneToUse =
    cxr.creeps.length < 2 ? 300 :
    cxr.creeps.length < 4 ? 450 :
    cxr.creeps.length < 6 ? 550 :
    cxr.creeps.length < 8 ? 650 :
    800;
  if(Game.spawns.pyon.room.energyAvailable < eneToUse) return;

  const f = (parts: Array<BodyPartConstant>) => {
    const name = genNewName(cx);
    const taste = 0 | Math.random() * (1 << 30);
    const err = Game.spawns.pyon.spawnCreep(parts, name, { memory: {
      taste, spawnedRoomName: room.name, spawnID: Game.spawns.pyon.id,
    }});

    if(err === 0) {
      LG.println(preLog, `Started to draw ${name} with ${parts}.`);
    }
    return err;
  };

  {
    const W = WORK, C = CARRY, M = MOVE, A = ATTACK;
    // t = ceil((all-MOVE-(CARRY if not carrying)) * [swamp:5,road:0.5] / MOVE)
    if(f([W,W,W,W,W,A,C,M,M,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([W,W,W,W,A,A,C,M,M,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([W,W,W,W,A,C,C,M,M,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([W,W,W,W,A,C,M,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([W,W,W,A,C,M,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([W,W,W,C,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([W,W,C,M,M]) === ERR_NOT_ENOUGH_ENERGY)
    f([W,C,M]);
  }
}

export function genNewName(cx: Context): c.CharaName {
  const ns = c.charaNames.filter(n => !Game.creeps[n]);
  if(ns.length > 0) {
    return R.a.sampleNonempty(ns);
  } else {
    throw new Error('all chara names have been used.');
  }
}
