"use strict";
const C = require('consts');
const M = require('wrap.memory');
const R = require('rab');

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
        chara.say(`仕事${mem.ncState}`)
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
        mem.taste_ = Math.floor(Math.random() * (1 << 30));
        chara.say('食事');
      }
    }
  },

  balanceSources(cx, chara) {
    const rn = chara.room.name;
    const mem = M(chara);

    mem.ncSrcID = R.a.balance(
      cx.r[rn].sourcesBalance,
      cx.creeps.map(c => M(c).ncSrcID),
    );

    // swap
    R.u.safely(() => {
      const sources = cx.r[chara.room.name].sources;
      const cr1 = chara;
      const mem1 = mem;

      const src1 = sources.find(s => s.id === mem1.ncSrcID);
      if(!src1) return;
      const dist1 = cr1.pos.findPathTo(src1).length;
      // console.log(dist1);
      for(const cr2 of cx.creeps) {
        const mem2 = M(cr2);
        if(mem2.ncState !== C.NormalCharaStates.GAIN_SRC) continue;

        const src2 = sources.find(s => s.id === mem2.ncSrcID);
        if(!src2) continue;
        const dist2 = cr2.pos.findPathTo(src2).length;
        const newDist1 = cr1.pos.findPathTo(src2).length;
        const newDist2 = cr2.pos.findPathTo(src1).length;
        // console.log(dist2, newDist1, newDist2);
        if(newDist1 < dist1 && newDist2 < dist2) {
          mem1.ncSrcID = src2.id;
          mem2.ncSrcID = src1.id;
          if(cx.debug) console.log(`Swapped source of ${cr1.name} and ${cr2.name}.`)
          break;
        }
      }
    });
  },

  balanceWork(cx, chara) {
    const rn = chara.room.name;
    const mem = M(chara);

    mem.ncState = R.a.balance(
      cx.r[rn].workBalance,
      cx.creeps.map(c => M(c).ncState),
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
      const drop = chara.room.find(FIND_DROPPED_RESOURCES);
      if(drop.length > 0) {
        const err = chara.pickup(drop[0]);
        if(err === ERR_NOT_IN_RANGE) {
          chara.moveTo(drop[0], {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
        }
        if(cx.debug && err !== OK) {
          console.log(`${chara}.pickup: ${err}`);
        }
        return { end: chara.carry.energy >= chara.carryCapacity - 4 };
      }
    }
  },

  gainSrc(cx, chara) {
    const mem = M(chara);

    const src = (() => {
      const sources = cx.r[chara.room.name].sources;
      for(let i = 0; i < 3; ++i) {
        const src = sources.find(s => s.id === mem.ncSrcID);
        if(src) return src;
        this.balanceSources(cx, chara);
      }
      return sources[0];
    })();

    const err = chara.harvest(src);
    if(err === ERR_NOT_IN_RANGE) {
      if(cx.shouldPickup) {
        const ret = this.pickEne(cx, chara);
        if(ret) return ret;
      }
      chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
    } else if(err === ERR_NOT_ENOUGH_RESOURCES) {
      if(cx.debug) console.log(`${chara}.harvest: ${err}`);
      // this.balanceSources(cx, chara);
      chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
    } else if(err !== OK) {
      console.log(`${chara}.harvest: ${err}`);
    }
    return { end: chara.carry.energy >= chara.carryCapacity - 4 };
  },

  balanceWorkSpawn(cx, chara) {
    const spawns = cx.r[chara.room.name].spawnsUnfilled;
    M(chara).ncWsSpnID = chara.pos.findClosestByRange(_.shuffle(spawns)).id;
    console.log(`${chara.name} targeted spawnex #${M(chara).ncWsSpnID}`);
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
    // console.log(JSON.stringify(tgt));

    const err = chara.transfer(tgt, RESOURCE_ENERGY);
    if(err == ERR_NOT_IN_RANGE) {
      const err = chara.moveTo(tgt, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
      // console.log(JSON.stringify([chara.pos, tgt.pos]));
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
      const tgt = R.a.cycleGet(targets, Math.floor(M(chara).taste_ / 13));
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
    const cSites = cx.r[chara.room.name].constructionSites;
    M(chara).ncWbTgtID = chara.pos.findClosestByRange(_.shuffle(cSites)).id;
    console.log(`${chara.name} targeted build #${M(chara).ncWbTgtID}`);
  },

  workBuild(cx, chara) {
    const targets = cx.r[chara.room.name].constructionSites;
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
