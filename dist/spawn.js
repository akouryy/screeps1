"use strict";
const c = require('consts');
const R = require('rab');

module.exports = {
  tick(cx) {
    this.clearMemory(cx);
    if(cx.creeps.length < 13) {
      this.spawn(cx, {
        [c.roles.CHARGE]: 0.3,
        [c.roles.UP]: 0.4,
        [c.roles.BUILD]: 0.3,
      });
    }
  },

  clearMemory(cx) {
    for(const name in Memory.creeps) {
      if(!Game.creeps[name]) {
        delete Memory.creeps[name];
        console.log(`Cremated ${name}.`);
      }
    }
  },

  spawn(cx, rolePs) {
    if(cx.stopSpawn) return;

    const eneToUse =
      cx.creeps.length < 5 ? 450 :
      cx.creeps.length < 8 ? 550 :
      cx.creeps.length < 10 ? 650 :
      800;
    if(Game.spawns.pyon.room.energyAvailable < eneToUse) return;

    const f = parts => {
      const name = this.genNewName(cx);
      const taste = Math.floor(Math.random() * (1 << 30));
      const err = Game.spawns.pyon.spawnCreep(parts, name, { memory: { taste }});

      if(err === 0) {
        console.log(`Started to draw ${name} with ${parts}.`);
      }
      return err;
    };

    // t = ceil((all-MOVE-(CARRY if not carrying)) * [swamp:5,road:0.5] / MOVE)
    if(f([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,CARRY,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,CARRY,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    f([WORK,CARRY,MOVE]);
  },

  genNewName(cx) {
    const ns = c.creepNames.filter(n => !Game.creeps[n]);
    if(ns.length > 0) {
      return ns[Math.floor(Math.random() * ns.length)];
    } else {
      return Math.random().toString();
    }
  },
};
