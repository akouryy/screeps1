const C = require('consts');
const R = require('rab');

var roleBuild = {
  /** @param {Creep} creep **/
  tick: function(cx, creep) {
    creep.memory.realRole = C.roles.BUILD;

    if(creep.memory.building && creep.carry.energy == 0) {
      creep.memory.building = false;
      if(!creep.memory.freeRole) {
        creep.memory.freeRole = true;
        creep.memory.becomeFreeRole = true;
        if(cx.debug) console.log(`${creep.name} becomes free.`);
        creep.memory.taste = Math.floor(Math.random() * (1 << 30));
      }
      creep.say('休憩');
    }
    if(!creep.memory.building && creep.carry.energy >= creep.carryCapacity-4) {
      creep.memory.building = true;
      if(cx.debug) console.log(`${creep.name} starts build.`);
      creep.memory.freeRole = false;
      creep.say('構築');
    }

    if(creep.memory.building) {
      const targets = cx.constructionSites[0];
      if(targets.length > 0) {
        const tgt =
          targets.find(t => t.structureType === STRUCTURE_TOWER) ||
          R.a.cycleGet(targets.slice(0,3), Math.floor(creep.memory.taste / 17));
        if(creep.build(tgt) == ERR_NOT_IN_RANGE) {
          creep.moveTo(tgt, {visualizePathStyle: {stroke: C.charaColors[creep.name], opacity: 1}});
        }
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

module.exports = roleBuild;
