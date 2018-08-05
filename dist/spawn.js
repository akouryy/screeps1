const c = require('consts');
const R = require('rab');

const exp = module.exports = {
  tick: (cx) => {
    try {
      exp.clearMemory(cx);
      if(cx.creeps.length < 13) {
        exp.spawn(cx, {
          [c.roles.CHARGE]: 0.3,
          [c.roles.UP]: 0.4,
          [c.roles.BUILD]: 0.3,
        });
      }
    } catch(err) {
      try {
        console.error(err, err.stack);
      } catch(e) {
        console.log(err, err.stack);
      }
    }
  },

  clearMemory: (cx) => {
    for(const name in Memory.creeps) {
      if(!Game.creeps[name]) {
        delete Memory.creeps[name];
        console.log(`Cremated ${name}.`);
      }
    }
  },

  spawn: (cx, rolePs) => {
    if(cx.stopSpawn) return;

    const eneToUse = cx.creeps.length < 10 ? 550 : 800;
    if(Game.spawns.pyon.room.energyAvailable < eneToUse) return;

    const f = parts => {
      const name = exp.genNewName(cx);
      // const role = Number(exp.getDesirableRole(cx, rolePs));
      const taste = Math.floor(Math.random() * (1 << 30));
      // const alwaysUp = role === c.roles.BUILD && Math.floor(taste / 486) % 2 === 0;
      const err = Game.spawns.pyon.spawnCreep(parts, name, { memory: { /*role, alwaysUp,*/ taste }});

      if(err === 0) {
        console.log(`Started to draw ${name} with ${parts}.`);
      }
      return err;
    };

    if(f([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    if(f([WORK,WORK,WORK,WORK,CARRY,MOVE]) === ERR_NOT_ENOUGH_ENERGY)
    f([WORK,CARRY,MOVE]);
  },

  genNewName: (cx) => {
    const ns = c.creepNames.filter(n => !Game.creeps[n]);
    if(ns.length > 0) {
      return ns[Math.floor(Math.random() * ns.length)];
    } else {
      return Math.random().toString();
    }
  },

  getDesirableRole: (cx, ps) => {
    const ns = _.countBy(cx.creeps.map(c => c.memory.role));
    return Number(_.min(_.keys(ns), k => ns[k]));
    /*
    let rand = Math.random();
    for(const role in ps) {
      rand -= ps[role];
      if(rand < 0) return role;
    }
    */
  },
};
