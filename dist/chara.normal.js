const C = require('consts');
const R = require('rab');

module.exports = {
  tick(cx, chara) {
    if(!chara.memory.normalCharaState) {
      chara.memory.normalCharaState = C.NormalCharaStates.GAIN_SRC;
      this.balanceSources(cx, chara);
    }
    if(chara.memory.normalCharaState === C.NormalCharaStates.GAIN_SRC) {
      const res = this.gainSrc(cx, chara);
      if(res.end) {
        chara.memory.normalCharaSourceID = null;
        this.balanceWork(cx, chara);
        chara.say(`仕事${chara.memory.normalCharaState}`)
      }
    } else {
      const res = (() => {
        switch(chara.memory.normalCharaState) {
          case C.NormalCharaStates.WORK_SPAWN:
            return this.workSpawn(cx, chara);
          case C.NormalCharaStates.WORK_BUILD:
            return this.workBuild(cx, chara);
          case C.NormalCharaStates.WORK_UP:
            return this.workUp(cx, chara);
          case C.NormalCharaStates.WORK_TOWER:
            return this.workTower(cx, chara);
          default:
            throw new Error('Unknown normalCharaState: ' + JSON.stringify(chara.memory.normalCharaState));
        }
      })();
      if(res.end) {
        chara.memory.normalCharaState = C.NormalCharaStates.GAIN_SRC;
        this.balanceSources(cx, chara);
        chara.memory.taste = Math.floor(Math.random() * (1 << 30));
        chara.say('食事');
      }
    }
  },

  balanceSources(cx, chara) {
    const rn = chara.room.name;

    chara.memory.normalCharaSourceID = R.a.balance(
      cx.r[rn].sourcesBalance,
      cx.creeps.map(c => c.memory.normalCharaSourceID),
    );

    // swap
    R.u.safely(() => {
      const sources = cx.r[chara.room.name].sources;
      const cr1 = chara;

      const src1 = sources.find(s => s.id === cr1.memory.normalCharaSourceID);
      if(!src1) return;
      const dist1 = cr1.pos.findPathTo(src1).length;
      // console.log(dist1);
      for(const cr2 of cx.creeps) {
        if(cr2.memory.normalCharaState !== C.NormalCharaStates.GAIN_SRC) continue;

        const src2 = sources.find(s => s.id === cr2.memory.normalCharaSourceID);
        if(!src2) continue;
        const dist2 = cr2.pos.findPathTo(src2).length;
        const newDist1 = cr1.pos.findPathTo(src2).length;
        const newDist2 = cr2.pos.findPathTo(src1).length;
        // console.log(dist2, newDist1, newDist2);
        if(newDist1 < dist1 && newDist2 < dist2) {
          cr1.memory.normalCharaSourceID = src2.id;
          cr2.memory.normalCharaSourceID = src1.id;
          if(cx.debug) console.log(`Swapped source of ${cr1.name} and ${cr2.name}.`)
          break;
        }
      }
    });
  },

  balanceWork(cx, chara) {
    const rn = chara.room.name;

    chara.memory.normalCharaState = R.a.balance(
      cx.r[rn].workBalance,
      cx.creeps.map(c => c.memory.normalCharaState),
    );
  },

  pickEne(cx, chara) {
    if(cx.shouldPickup) {
      const drop = chara.room.find(FIND_DROPPED_RESOURCES);
      if(drop.length > 0) {
        const err = chara.pickup(drop[0]);
        if(err === ERR_NOT_IN_RANGE) {
          chara.moveTo(drop[0], {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
        } else if(err !== OK) {
          console.log(`${chara}.pickup: ${err}`);
        }
        return { end: chara.carry.energy >= chara.carryCapacity - 4 };
      }
    }
  },

  gainSrc(cx, chara) {
    const src = (() => {
      const sources = cx.r[chara.room.name].sources;
      for(let i = 0; i < 3; ++i) {
        const src = sources.find(s => s.id === chara.memory.normalCharaSourceID);
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
      this.balanceSources(cx, chara);
      chara.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[chara.name], opacity: 1}});
    }
    if(err !== OK) {
      if(!cx.debug) console.log(`${chara}.harvest: ${err}`)
    }
    return { end: chara.carry.energy >= chara.carryCapacity - 4 };
  },

  workSpawn(cx, chara) {
    let end = false;
    const targets = cx.chargeables[0];
    if(targets.length > 0) {
      const tgt = R.a.cycleGet(targets, Math.floor(chara.memory.taste / 13));
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
      const tgt = R.a.cycleGet(targets, Math.floor(chara.memory.taste / 13));
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

  workBuild(cx, chara) {
    let end = false;
    const targets = cx.constructionSites[0];
    if(targets.length > 0) {
      const tgt =
        targets.find(t => t.structureType === STRUCTURE_TOWER) ||
        R.a.cycleGet(targets.slice(0,3), Math.floor(chara.memory.taste / 17));
      if(chara.build(tgt) == ERR_NOT_IN_RANGE) {
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
};
