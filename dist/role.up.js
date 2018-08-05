const C = require('consts');
const R = require('rab');

module.exports = {
  /** @param {Creep} creep **/
  tick: function(cx, creep) {
    creep.memory.realRole = C.roles.UP;

    if(creep.memory.upgrading && creep.carry.energy == 0) {
      creep.memory.upgrading = false;
      if(!creep.memory.freeRole) {
        creep.memory.freeRole = true;
        creep.memory.becomeFreeRole = true;
        if(cx.debug) console.log(`${creep.name} becomes free.`);
        creep.memory.taste = Math.floor(Math.random() * (1 << 30));
      }
      creep.say('食事');
    }
    if(!creep.memory.upgrading && creep.carry.energy >= creep.carryCapacity-4) {
      creep.memory.freeRole = false;
      creep.memory.upgrading = true;
      if(cx.debug) console.log(`${creep.name} starts up.`);
      creep.say('訓練');
    }

    if(creep.memory.upgrading) {
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: C.charaColors[creep.name], opacity: 1}});
      }
    }
    else {
      const sources = cx.sources[0];
      const src = sources[creep.memory.taste % 3 < 2 ? 0 : 1];
      if(creep.harvest(src) == ERR_NOT_IN_RANGE) {
        creep.moveTo(src, {visualizePathStyle: {stroke: C.charaColors[creep.name], opacity: 1}});
      }
    }
  }
};
