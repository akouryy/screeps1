import * as C from 'consts';
import { Context } from 'context_calc';
import * as M from 'wrap.memory';
import * as R from 'rab';
import { Chara } from 'wrap.chara';
import * as Charas from 'wrap.chara';
import * as LG from 'wrap.log';

const preLog = LG.color('#fcc', ' [nc]       ');

export function tick(cx: Context, chara: Chara) {
  const mem = new M.CreepMemoryWrapper(chara);
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;

  if(!mem.ncState) {
    mem.ncState = C.NormalCharaStates.GAIN_SRC;
    balanceSources(cx, chara);
  }
  LG.safely(() => {
    if(cxr.attacked) attackLittle(cx, chara);
  });
  if(mem.ncState === C.NormalCharaStates.GAIN_SRC) {
    const res = gainSrc(cx, chara);
    if(res && res.end) {
      mem.ncSrcID = undefined;
      balanceWork(cx, chara);
      chara.say(`仕事=${C.NormalCharaStateToShortName[mem.ncState]}`);
    }
  } else {
    const res = (() => {
      switch(mem.ncState) {
        case C.NormalCharaStates.WORK_SPAWN:
          return workSpawn(cx, chara);
        case C.NormalCharaStates.WORK_BUILD:
          return workBuild(cx, chara);
        case C.NormalCharaStates.WORK_UP:
          return workUp(cx, chara);
        case C.NormalCharaStates.WORK_TOWER:
          return workTower(cx, chara);
        default:
          throw new Error('Unknown normalCharaState: ' + JSON.stringify(mem.ncState));
      }
    })();
    if(res && res.end) {
      mem.ncState = C.NormalCharaStates.GAIN_SRC;
      balanceSources(cx, chara);
      mem.taste_ = 0 | Math.random() * (1 << 30);
      chara.say('補給');
    }
  }
}

export function balanceSources(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(!cxr) return;
  const mem = new M.CreepMemoryWrapper(chara);

  if(Math.random() < (cxr.attacked ? 0.3 : 0.3) && cxr.withdrawTargets.length > 0) {
    mem.ncSrcID = R.a.sample(cxr.withdrawTargets).id;
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)} targeted withdrawee #${mem.ncSrcID}.`);
    }
  } else {
    mem.ncSrcID = R.a.balance(
      cxr.sourcesBalance,
      cxr.creeps.map(c => new M.CreepMemoryWrapper(c).ncSrcID),
    );
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)} targeted source #${mem.ncSrcID}.`);
    }
  }

  // swap
  LG.safely(() => {
    const sourceLikes = cxr.sourceLikes;
    const cr1 = chara;
    const mem1 = mem;

    const src1 = sourceLikes.find(s => s.id === mem1.ncSrcID);
    if(!src1) return;
    const dist1 = cr1.pos.findPathTo(src1).length;
    for(const cr2 of cxr.myCharas) {
      const mem2 = new M.CreepMemoryWrapper(cr2);
      if(mem2.ncState !== C.NormalCharaStates.GAIN_SRC) continue;

      const src2 = sourceLikes.find(s => s.id === mem2.ncSrcID);
      if(!src2) continue;
      const dist2 = cr2.pos.findPathTo(src2).length;
      const newDist1 = cr1.pos.findPathTo(src2).length;
      const newDist2 = cr2.pos.findPathTo(src1).length;
      if(newDist1 < dist1 && newDist2 < dist2 || newDist1 < dist2 && newDist2 < dist1) {
        mem1.ncSrcID = src2.id;
        mem2.ncSrcID = src1.id;
        if(cx.flags.debug) {
          LG.println(preLog, `Swapped sources of ${Charas.logFormat(cr1)} and ${Charas.logFormat(cr2)}.`);
        }
        break;
      }
    }
  });
}

export function balanceWork(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(!cxr) return;
  const mem = new M.CreepMemoryWrapper(chara);

  mem.ncState = R.a.balanceNum(
    cxr.workBalance,
    cxr.creeps.map(c => new M.CreepMemoryWrapper(c).ncState),
  );
  switch(mem.ncState) {
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
      throw new Error('Unknown normalCharaState: ' + JSON.stringify(mem.ncState));
  }
}

export function pickEne(cx: Context, chara: Chara) {
  if(cx.flags.shouldPickup) {
    const drop = chara.room.find(FIND_DROPPED_RESOURCES, r => r.resourceType === RESOURCE_ENERGY);
    if(drop.length > 0) {
      const err = chara.pickup(drop[0]);
      if(err === ERR_NOT_IN_RANGE) {
        chara.moveTo(drop[0], {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
      }
      if(cx.flags.debug && err !== OK) {
        LG.println(preLog, `err: ${Charas.logFormat(chara)}.pickup: ${err}.`);
      }
      return { end: chara.carry.energy >= chara.carryCapacity - 4 };
    }
  }
  return undefined;
}

export function gainSrc(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;

  const mem = new M.CreepMemoryWrapper(chara);
  mem.ncweWait = mem.ncweWait || 0;

  const src = (() => {
    const sls = cxr.sourceLikes;
    for(let i = 0; i < 3; ++i) {
      const src = sls.find(s => s.id === mem.ncSrcID);
      if(src) return src;
      mem.ncweWait = 0;
      balanceSources(cx, chara);
    }
    return sls[0];
  })();

  if((mem.ncweWait & 7) === 7) {
    const dir = _.sample([TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT]);
    const err = chara.move(dir);
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)}<${mem.ncweWait}>'s breakthrough to ${dir}: ${err}`);
      chara.say('打開');
    }
    if((mem.ncweWait & 31) === 31) {
      balanceSources(cx, chara);
      mem.ncweWait = 0;
    } else {
      ++mem.ncweWait;
    }
    return { end: false };
  }

  const err =
    src instanceof Source ?
      chara.harvest(src) :
    src instanceof Resource ?
      chara.pickup(src):
      chara.withdraw(src, RESOURCE_ENERGY);

  if(err === ERR_NOT_IN_RANGE) {
    if(cx.flags.shouldPickup) {
      const ret = pickEne(cx, chara);
      if(ret) return ret;
    }
    chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});

    const lnDist = chara.pos.getRangeTo(src);
    if(lnDist === 2 || lnDist === 3) ++mem.ncweWait;
    else mem.ncweWait = 0;

  } else if(err === ERR_NOT_ENOUGH_RESOURCES) {
    if(cx.flags.debug) {
      LG.println(preLog, `${Charas.logFormat(chara)}.harvest: ${err}`);
    }
    if(!(src instanceof Source) || src.ticksToRegeneration > 30) {
      balanceSources(cx, chara);
    }
    chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});

  } else if(err !== OK) {
    LG.println(preLog, `${Charas.logFormat(chara)}.harvest: ${err}`);
  }
  return { end: chara.carry.energy >= chara.carryCapacity - 4 };
}

export function balanceWorkSpawn(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const spawns = cxr.spawnsUnfilled;
  const spawn = chara.pos.findClosestByRange(_.shuffle(spawns));
  if(!spawn) {
    return { end: true };
  }
  new M.CreepMemoryWrapper(chara).ncWsSpnID = spawn.id;
  if(cx.flags.debug) {
    LG.println(preLog, `${Charas.logFormat(chara)} targeted spawnex #${spawn.id}`);
  }
  return undefined;
}

export function workSpawn(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const targets = cxr.spawnsUnfilled;
  if(targets.length === 0) {
    return { end: true };
  }

  let end = false;

  const tgt = (() => {
    const mem = new M.CreepMemoryWrapper(chara);
    for(let i = 0; i < 3; ++i) {
      const tgt = targets.find(t => t.id === mem.ncWsSpnID);
      if(tgt) return tgt;
      balanceWorkSpawn(cx, chara);
    }
    return targets[0];
  })();

  const err = chara.transfer(tgt, RESOURCE_ENERGY);
  if(err == ERR_NOT_IN_RANGE) {
    const err = chara.moveTo(tgt, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
  }
  if(chara.carry.energy === 0) {
    end = true;
  }
  return { end };
}

export function workUp(cx: Context, chara: Chara) {
  if(!chara.room.controller) return;
  if(chara.upgradeController(chara.room.controller) == ERR_NOT_IN_RANGE) {
    chara.moveTo(chara.room.controller, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
  }
  return { end: chara.carry.energy === 0 };
}

export function workTower(cx: Context, chara: Chara) {
  let end = false;
  const targets = cx.towers[0];
  if(targets.length > 0) {
    const tgt = R.a.cycleGet(targets, 0 | new M.CreepMemoryWrapper(chara).taste_ / 13);
    if(chara.transfer(tgt, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      chara.moveTo(tgt, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
    }
    if(chara.carry.energy === 0) {
      end = true;
    }
  } else {
    end = true;
  }
  return { end };
}

export function balanceWorkBuild(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const cSites = cxr.constructionSites;
  const cSite = chara.pos.findClosestByRange(_.shuffle(cSites))
  if(!cSite) {
    return { end: true };
  }
  new M.CreepMemoryWrapper(chara).ncWbTgtID = cSite.id;
  LG.println(preLog, `${Charas.logFormat(chara)} targeted build #${cSite.id}.`);
  return undefined;
}

export function workBuild(cx: Context, chara: Chara) {
  const cxr = cx.r[chara.room.name];
  if(cxr === undefined) return;
  const targets = cxr.constructionSites;
  if(targets.length === 0) {
    return { end: true };
  }

  let end = false;

  const tgt = (() => {
    const mem = new M.CreepMemoryWrapper(chara);
    for(let i = 0; i < 3; ++i) {
      const tgt = targets.find(t => t.id === mem.ncWbTgtID);
      if(tgt) return tgt;
      balanceWorkBuild(cx, chara);
    }
    return targets[0];
  })();

  if(chara.build(tgt) == ERR_NOT_IN_RANGE) {
    chara.moveTo(tgt, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
  }
  if(chara.carry.energy === 0) {
    end = true;
  }
  return { end };
}

export function attackLittle(cx: Context, chara: Chara) {
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
