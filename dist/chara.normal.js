"use strict";
const C = require('consts');
const M = require('wrap.memory');
const R = require('rab');
const LG = require('wrap.log');

const preLog = LG.color('#fcc', ' [nc]       ');

module.exports = {
  tick(cx, chara) {
    const mem = M(chara);
    if(!mem.ncState) {
      mem.ncState = C.NormalCharaStates.GAIN_SRC;
      this.balanceSources(cx, chara);
    }
    if(mem.ncState === C.NormalCharaStates.GAIN_SRC) {
      const res = this.gainSrc(cx, chara);
      if(res.end) {
        mem.ncSrcID = null;
        this.balanceWork(cx, chara);
        chara.say(`仕事=${C.NormalCharaStateToShortName[mem.ncState]}`);
      }
    } else {
      const res = (() => {
        switch(mem.ncState) {
          case C.NormalCharaStates.WORK_SPAWN:
            return this.workSpawn(cx, chara);
          case C.NormalCharaStates.WORK_BUILD:
            return this.workBuild(cx, chara);
          case C.NormalCharaStates.WORK_UP:
            return this.workUp(cx, chara);
          case C.NormalCharaStates.WORK_TOWER:
            return this.workTower(cx, chara);
          default:
            throw new Error('Unknown normalCharaState: ' + JSON.stringify(mem.ncState));
        }
      })();
      if(res.end) {
        mem.ncState = C.NormalCharaStates.GAIN_SRC;
        this.balanceSources(cx, chara);
        mem.taste_ = 0 | Math.random() * (1 << 30);
        chara.say('補給');
      }
    }
  },

  balanceSources(cx, chara) {
    const cxr = cx.r[chara.room.name];
    const mem = M(chara);

    if(Math.random() < 0.5 && cxr.withdrawTargets.length > 0) {
      mem.ncSrcID = R.a.sample(cxr.withdrawTargets).id;
      if(cx.debug) {
        LG.println(preLog, `${LG.chara(chara)} targeted withdrawee #${mem.ncSrcID}.`);
      }
    } else {
      mem.ncSrcID = R.a.balance(
        cxr.sourcesBalance,
        cxr.creeps.map(c => M(c).ncSrcID),
      );
      if(cx.debug) {
        LG.println(preLog, `${LG.chara(chara)} targeted source #${mem.ncSrcID}.`);
      }
    }

    // swap
    R.u.safely(() => {
      const sourceLikes = cx.r[chara.room.name].sourceLikes;
      const cr1 = chara;
      const mem1 = mem;

      const src1 = sourceLikes.find(s => s.id === mem1.ncSrcID);
      if(!src1) return;
      const dist1 = cr1.pos.findPathTo(src1).length;
      for(const cr2 of cxr.creeps) {
        const mem2 = M(cr2);
        if(mem2.ncState !== C.NormalCharaStates.GAIN_SRC) continue;

        const src2 = sourceLikes.find(s => s.id === mem2.ncSrcID);
        if(!src2) continue;
        const dist2 = cr2.pos.findPathTo(src2).length;
        const newDist1 = cr1.pos.findPathTo(src2).length;
        const newDist2 = cr2.pos.findPathTo(src1).length;
        if(newDist1 < dist1 && newDist2 < dist2 || newDist1 < dist2 && newDist2 < dist1) {
          mem1.ncSrcID = src2.id;
          mem2.ncSrcID = src1.id;
          if(cx.debug) {
            LG.println(preLog, `Swapped sources of ${LG.chara(cr1)} and ${LG.chara(cr2)}.`);
          }
          break;
        }
      }
    });
  },

  balanceWork(cx, chara) {
    const cxr = cx.r[chara.room.name];
    const mem = M(chara);

    mem.ncState = R.a.balance(
      cxr.workBalance,
      cxr.creeps.map(c => M(c).ncState),
    );
    switch(mem.ncState) {
      case C.NormalCharaStates.WORK_SPAWN:
        this.balanceWorkSpawn(cx, chara);
        break;
      case C.NormalCharaStates.WORK_BUILD:
        this.balanceWorkBuild(cx, chara);
        break;
      case C.NormalCharaStates.WORK_UP:
        break;
      case C.NormalCharaStates.WORK_TOWER:
        break;
      default:
        throw new Error('Unknown normalCharaState: ' + JSON.stringify(mem.ncState));
    }
  },

  pickEne(cx, chara) {
    if(cx.shouldPickup) {
      const drop = chara.room.find(FIND_DROPPED_RESOURCES, r => r.resourceType === RESOURCE_ENERGY);
      if(drop.length > 0) {
        const err = chara.pickup(drop[0]);
        if(err === ERR_NOT_IN_RANGE) {
          chara.moveTo(drop[0], {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
        }
        if(cx.debug && err !== OK) {
          LG.println(preLog, `err: ${LG.chara(chara)}.pickup: ${err}.`);
        }
        return { end: chara.carry.energy >= chara.carryCapacity - 4 };
      }
    }
  },

  gainSrc(cx, chara) {
    const mem = M(chara);
    mem.ncweWait = mem.ncweWait || 0;

    const src = (() => {
      const sls = cx.r[chara.room.name].sourceLikes;
      for(let i = 0; i < 3; ++i) {
        const src = sls.find(s => s.id === mem.ncSrcID);
        if(src) return src;
        mem.ncweWait = 0;
        this.balanceSources(cx, chara);
      }
      return sls[0];
    })();

    if((mem.ncweWait & 7) === 7) {
      const dir = _.sample([TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT]);
      const err = chara.move(dir);
      if(cx.debug) {
        LG.println(preLog, `${LG.chara(chara)}<${mem.ncweWait}>'s breakthrough to ${dir}: ${err}`);
        chara.say('打開');
      }
      if((mem.ncweWait & 31) === 31) {
        this.balanceSources(cx, chara);
        mem.ncweWait = 0;
      } else {
        ++mem.ncweWait;
      }
      return { end: false };
    }

    const isHarvest = src instanceof Source;
    const isPickup = src instanceof Resource;
    const err = isHarvest ? chara.harvest(src) : chara.withdraw(src, RESOURCE_ENERGY);

    if(err === ERR_NOT_IN_RANGE) {
      if(cx.shouldPickup) {
        const ret = this.pickEne(cx, chara);
        if(ret) return ret;
      }
      chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});

      const lnDist = chara.pos.getRangeTo(src);
      if(lnDist === 2 || lnDist === 3) ++mem.ncweWait;
      else mem.ncweWait = 0;

    } else if(err === ERR_NOT_ENOUGH_RESOURCES) {
      if(cx.debug) {
        LG.println(preLog, `${LG.chara(chara)}.harvest: ${err}`);
      }
      if(!src.ticksToRegeneration || src.ticksToRegeneration > 30) {
        this.balanceSources(cx, chara);
      }
      chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});

    } else if(err !== OK) {
      LG.println(preLog, `${LG.chara(chara)}.harvest: ${err}`);
    }
    return { end: chara.carry.energy >= chara.carryCapacity - 4 };
  },

  balanceWorkSpawn(cx, chara) {
    const spawns = cx.r[chara.room.name].spawnsUnfilled;
    const spawn = chara.pos.findClosestByRange(_.shuffle(spawns));
    if(!spawn) {
      return { end: true };
    }
    M(chara).ncWsSpnID = spawn.id;
    if(cx.debug) {
      LG.println(preLog, `${LG.chara(chara)} targeted spawnex #${spawn.id}`);
    }
  },

  workSpawn(cx, chara) {
    const targets = cx.r[chara.room.name].spawnsUnfilled;
    if(targets.length === 0) {
      return { end: true };
    }

    let end = false;

    const tgt = (() => {
      const mem = M(chara);
      for(let i = 0; i < 3; ++i) {
        const tgt = targets.find(t => t.id === mem.ncWsSpnID);
        if(tgt) return tgt;
        this.balanceWorkSpawn(cx, chara);
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
  },

  workUp(cx, chara) {
    if(chara.upgradeController(chara.room.controller) == ERR_NOT_IN_RANGE) {
      chara.moveTo(chara.room.controller, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
    }
    return { end: chara.carry.energy === 0 };
  },

  workTower(cx, chara) {
    let end = false;
    const targets = cx.towers[0];
    if(targets.length > 0) {
      const tgt = R.a.cycleGet(targets, 0 | M(chara).taste_ / 13);
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
  },

  balanceWorkBuild(cx, chara) {
    const cxr = cx.r[chara.room.name];
    const cSites = cxr.constructionSites;
    const cSite = chara.pos.findClosestByRange(_.shuffle(cSites))
    if(!cSite) {
      return { end: true };
    }
    M(chara).ncWbTgtID = cSite.id;
    LG.println(preLog, `${LG.chara(chara)} targeted build #${M(chara).ncWbTgtID}.`);
  },

  workBuild(cx, chara) {
    const cxr = cx.r[chara.room.name];
    const targets = cxr.constructionSites;
    if(targets.length === 0) {
      return { end: true };
    }

    let end = false;

    const tgt = (() => {
      const mem = M(chara);
      for(let i = 0; i < 3; ++i) {
        const tgt = targets.find(t => t.id === mem.ncWbTgtID);
        if(tgt) return tgt;
        this.balanceWorkBuild(cx, chara);
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
  },
};
