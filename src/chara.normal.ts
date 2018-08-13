import _ from 'lodash';
import * as C from 'consts';
import { Context } from 'context_calc';
import * as R from 'rab';
import { Chara } from 'wrap.chara';
import * as Charas from 'wrap.chara';
import * as LG from 'wrap.log';
import * as charaMoveManager from 'chara/manage.move';
import { CharaNormal, isCharaNormal } from 'chara/born';

const preLog = LG.color('#fcc', ' [nc]       ');

export function tick(cx: Context, chara: CharaNormal) {
  if(chara.memory.spawnedRoomName && chara.room.name !== chara.memory.spawnedRoomName) {
    goBackToSpawnedRoom(cx, chara);
    return;
  }

  const mem = chara.memory;
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;

  if(!mem.normalCharaState) {
    mem.normalCharaState = C.NormalCharaStates.GAIN_SRC;
    balanceSources(cx, chara);
  }
  LG.safely(() => {
    if(cxr.attacked) attackLittle(cx, chara);
  });
  if(mem.normalCharaState === C.NormalCharaStates.GAIN_SRC) {
    const res = gainSrc(cx, chara);
    if(res && res.end) {
      mem.normalCharaSourceID = undefined;
      balanceWork(cx, chara);
      chara.say(`仕事=${C.NormalCharaStateToShortName[mem.normalCharaState]}`);
    }
  } else {
    const res = (() => {
      switch(mem.normalCharaState) {
        case C.NormalCharaStates.WORK_SPAWN:
          return workSpawn(cx, chara);
        case C.NormalCharaStates.WORK_BUILD:
          return workBuild(cx, chara);
        case C.NormalCharaStates.WORK_UP:
          return workUp(cx, chara);
        case C.NormalCharaStates.WORK_TOWER:
          return workTower(cx, chara);
        default:
          throw new Error('Unknown normalCharaState: ' + JSON.stringify(mem.normalCharaState));
      }
    })();
    if(res && res.end) {
      mem.normalCharaState = C.NormalCharaStates.GAIN_SRC;
      balanceSources(cx, chara);
      mem.taste = 0 | Math.random() * (1 << 30);
      chara.say('補給');
    }
  }
}

export function balanceSources(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(!cxr) return;
  const mem = chara.memory;

  if(Math.random() < (cxr.attacked ? 0.3 : 0.3) && cxr.withdrawTargets.length > 0) {
    mem.normalCharaSourceID = R.a.sampleNonempty(cxr.withdrawTargets).id;
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)} targeted withdrawee #${mem.normalCharaSourceID}.`);
    }
  } else {
    mem.normalCharaSourceID = R.a.balance(
      cxr.sourcesBalance,
      cxr.myCharas.map(c => isCharaNormal(c) ? c.memory.normalCharaSourceID : undefined),
    );
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)} targeted source #${mem.normalCharaSourceID}.`);
    }
  }

  // swap
  LG.safely(() => {
    const sourceLikes = cxr.sourceLikes;
    const cr1 = chara;
    const mem1 = mem;

    const src1 = sourceLikes.find(s => s.id === mem1.normalCharaSourceID);
    if(!src1) return;
    const dist1 = cr1.pos.findPathTo(src1).length;
    for(const cr2 of cxr.myCharas) {
      if(!isCharaNormal(cr2)) continue;
      const mem2 = cr2.memory;
      if(mem2.normalCharaState !== C.NormalCharaStates.GAIN_SRC) continue;

      const src2 = sourceLikes.find(s => s.id === mem2.normalCharaSourceID);
      if(!src2) continue;
      const dist2 = cr2.pos.findPathTo(src2).length;
      const newDist1 = cr1.pos.findPathTo(src2).length;
      const newDist2 = cr2.pos.findPathTo(src1).length;
      if(newDist1 < dist1 && newDist2 < dist2 || newDist1 < dist2 && newDist2 < dist1) {
        mem1.normalCharaSourceID = src2.id;
        mem2.normalCharaSourceID = src1.id;
        if(cx.flags.debug) {
          LG.println(preLog, `Swapped sources of ${Charas.logFormat(cr1)} and ${Charas.logFormat(cr2)}.`);
        }
        break;
      }
    }
  });
}

export function balanceWork(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(!cxr) return;
  const mem = chara.memory;

  mem.normalCharaState = R.a.balanceNum(
    cxr.workBalance,
    cxr.myCharas.map(c => isCharaNormal(c) ? c.memory.normalCharaState : undefined),
  );
  switch(mem.normalCharaState) {
    case C.NormalCharaStates.WORK_SPAWN:
      balanceWorkSpawn(cx, chara);
      break;
    case C.NormalCharaStates.WORK_BUILD:
      balanceWorkBuild(cx, chara);
      break;
    case C.NormalCharaStates.WORK_UP:
      break;
    case C.NormalCharaStates.WORK_TOWER:
      break;
    default:
      throw new Error('Unknown normalCharaState: ' + JSON.stringify(mem.normalCharaState));
  }
}

export function pickEne(cx: Context, chara: CharaNormal) {
  if(cx.flags.shouldPickup) {
    const drop = chara.room.find(FIND_DROPPED_RESOURCES, r => r.resourceType === RESOURCE_ENERGY);
    if(drop.length > 0) {
      const err = chara.pickup(drop[0]);
      if(err === ERR_NOT_IN_RANGE) {
        charaMoveManager.registerMoveTo(cx, chara, drop[0]);
      }
      if(cx.flags.debug && err !== OK) {
        LG.println(preLog, `err: ${Charas.logFormat(chara)}.pickup: ${err}.`);
      }
      return { end: chara.carry.energy >= chara.carryCapacity - 4 };
    }
  }
  return undefined;
}

export function gainSrc(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;

  const mem = chara.memory;
  mem.normalCharaWorkEnergyWaiting = mem.normalCharaWorkEnergyWaiting || 0;

  const src = (() => {
    const sls = cxr.sourceLikes;
    for(let i = 0; i < 3; ++i) {
      const src = sls.find(s => s.id === mem.normalCharaSourceID);
      if(src) return src;
      mem.normalCharaWorkEnergyWaiting = 0;
      balanceSources(cx, chara);
    }
    return sls[0];
  })();

  if((mem.normalCharaWorkEnergyWaiting & 7) === 7) {
    const dir = R.a.sampleNonempty([TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT]);
    const err = chara.move(dir);
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)}<${mem.normalCharaWorkEnergyWaiting}>'s breakthrough to ${dir}: ${err}`);
      chara.say('打開');
    }
    if((mem.normalCharaWorkEnergyWaiting & 31) === 31) {
      balanceSources(cx, chara);
      mem.normalCharaWorkEnergyWaiting = 0;
    } else {
      ++mem.normalCharaWorkEnergyWaiting;
    }
    return { end: false };
  }

  const err =
    src instanceof Source ?
      chara.harvest(src) :
    src instanceof Resource ?
      chara.pickup(src):
      chara.withdraw(src, RESOURCE_ENERGY);

  if(err === OK) {
    charaMoveManager.blockOthersMove(cx, chara);
  } else if(err === ERR_NOT_IN_RANGE) {
    if(cx.flags.shouldPickup) {
      const ret = pickEne(cx, chara);
      if(ret) return ret;
    }
    const range = chara.pos.getRangeTo(src);
    charaMoveManager.registerMoveTo(cx, chara, src, { ignoreCreeps: range > 2 });

    const lnDist = chara.pos.getRangeTo(src);
    if(lnDist === 2 || lnDist === 3) ++mem.normalCharaWorkEnergyWaiting;
    else mem.normalCharaWorkEnergyWaiting = 0;

  } else if(err === ERR_NOT_ENOUGH_RESOURCES) {
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)}.harvest: ${err}`);
    }
    if(!(src instanceof Source) || src.ticksToRegeneration > 30) {
      balanceSources(cx, chara);
    }
    charaMoveManager.registerMoveTo(cx, chara, src);

  } else {
    LG.println(preLog, `${Charas.logFormat(chara)}.harvest: ${err}`);
  }
  return { end: chara.carry.energy >= chara.carryCapacity - 4 };
}

export function balanceWorkSpawn(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const spawns = cxr.spawnsUnfilled;
  const spawn = chara.pos.findClosestByRange(_.shuffle(spawns));
  if(!spawn) {
    return { end: true };
  }
  chara.memory.normalCharaWorkSpawnSpawnExID = spawn.id;
  if(cx.flags.debug) {
    LG.println(preLog, `${Charas.logFormat(chara)} targeted spawnex #${spawn.id}`);
  }
  return undefined;
}

export function workSpawn(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const targets = cxr.spawnsUnfilled;
  if(targets.length === 0) {
    return { end: true };
  }

  let end = false;

  const tgt = (() => {
    const mem = chara.memory;
    for(let i = 0; i < 3; ++i) {
      const tgt = targets.find(t => t.id === mem.normalCharaWorkSpawnSpawnExID);
      if(tgt) return tgt;
      balanceWorkSpawn(cx, chara);
    }
    return targets[0];
  })();

  const err = chara.transfer(tgt, RESOURCE_ENERGY);
  if(err == ERR_NOT_IN_RANGE) {
    charaMoveManager.registerMoveTo(cx, chara, tgt);
  }
  if(chara.carry.energy === 0) {
    end = true;
  }
  return { end };
}

export function workUp(cx: Context, chara: CharaNormal) {
  if(!chara.room.controller) return;
  if(chara.upgradeController(chara.room.controller) == ERR_NOT_IN_RANGE) {
    charaMoveManager.registerMoveTo(cx, chara, chara.room.controller);
  }
  return { end: chara.carry.energy === 0 };
}

export function workTower(cx: Context, chara: CharaNormal) {
  let end = false;
  const targets = cx.towers[0];
  if(targets.length > 0) {
    const tgt = R.a.cycleGet(targets, 0 | chara.memory.taste / 13);
    if(chara.transfer(tgt, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      charaMoveManager.registerMoveTo(cx, chara, tgt);
    }
    if(chara.carry.energy === 0) {
      end = true;
    }
  } else {
    end = true;
  }
  return { end };
}

export function balanceWorkBuild(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const cSites = cxr.constructionSites;
  const cSite = chara.pos.findClosestByRange(_.shuffle(cSites))
  if(!cSite) {
    return { end: true };
  }
  chara.memory.normalCharaWorkBuildTargetID = cSite.id;
  LG.println(preLog, `${Charas.logFormat(chara)} targeted build #${cSite.id}.`);
  return undefined;
}

export function workBuild(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const targets = cxr.constructionSites;
  if(targets.length === 0) {
    return { end: true };
  }

  let end = false;

  const tgt = (() => {
    const mem = chara.memory;
    for(let i = 0; i < 3; ++i) {
      const tgt = targets.find(t => t.id === mem.normalCharaWorkBuildTargetID);
      if(tgt) return tgt;
      balanceWorkBuild(cx, chara);
    }
    return targets[0];
  })();

  if(chara.build(tgt) == ERR_NOT_IN_RANGE) {
    charaMoveManager.registerMoveTo(cx, chara, tgt);
  }
  if(chara.carry.energy === 0) {
    end = true;
  }
  return { end };
}

export function attackLittle(cx: Context, chara: CharaNormal) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const atc = chara.pos.findClosestByRange(cxr.attackers);
  if(atc) {
    const err = chara.attack(atc);
    if(err !== OK && err !== ERR_NOT_IN_RANGE) {
      throw new Error(`${Charas.logFormat(chara)}.attack(${atc.owner.username}'s creep): ${err}`);
    }
  }
}

export function goBackToSpawnedRoom(cx: Context, chara: CharaNormal) {
  const room = Game.rooms[chara.memory.spawnedRoomName];
  if(!room) throw new Error(`${chara.name}: room "${chara.memory.spawnedRoomName}" not found.`);
  const spawn = room.find(FIND_STRUCTURES, { filter:
    s => s.structureType === STRUCTURE_SPAWN && s.id === chara.memory.spawnID
  })[0];
  if(!spawn) throw new Error(`${chara.name}: spawn "${chara.memory.spawnID}" not found.`);
  charaMoveManager.registerMoveTo(cx, chara, spawn);
}
