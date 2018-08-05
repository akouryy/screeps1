const C = require('consts');
const R = require('rab');

const exp = module.exports = {
  /** @param {Creep} creep **/
  tick: function(cx, creep, sourceIdx=0) {
    creep.memory.realRole = C.roles.CHARGE;


    if(!creep.memory.fetching && creep.carry.energy == 0) {
      creep.memory.fetching = true;
      if(!creep.memory.freeRole) {
        creep.memory.freeRole = true;
        creep.memory.becomeFreeRole = true;
        if(cx.debug) console.log(`${creep.name} becomes free.`);
        creep.memory.taste = Math.floor(Math.random() * (1 << 30));
      }
      creep.say('取りに行く');
    }
    if(creep.memory.fetching && creep.carry.energy >= creep.carryCapacity-4) {
      creep.memory.fetching = false;
      creep.memory.freeRole = false;
      if(cx.debug) console.log(`${creep.name} starts charge.`);
      creep.say('溜めに行く');
    }

    if(creep.memory.fetching) {
      const sources = cx.sources[0];
      // const src = R.a.cycleGet(sources, Math.floor(creep.memory.taste / 11));
      const src = sources[creep.memory.taste % 3 < 2 ? 0 : 1];
      if(creep.harvest(src) == ERR_NOT_IN_RANGE) {
        creep.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[creep.name], opacity: 1}});
      }
    } else {
      const targets = cx.chargeables[0];
      if(targets.length > 0) {
        const tgt =
          creep.memory.taste / 4 % 3 < 1 && targets.find(t => t.structureType === STRUCTURE_TOWER) ||
          R.a.cycleGet(targets, Math.floor(creep.memory.taste / 13));
        if(creep.transfer(tgt, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(tgt, {visualizePathStyle: {stroke: C.charaColors[creep.name], opacity: 1}});
        }
      }
    }
  }
};
