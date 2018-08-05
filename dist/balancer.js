const c = require('consts');
const R = require('rab');

const exp = module.exports = {
  tick(cx) {
    updateFrozen = Game.time % 20 === 0;
    for(const creep of cx.creeps) {
      const a = creep.memory.oldPos, b = creep.pos;
      if(creep.memory.becomeFreeRole || updateFrozen && a && a.x === b.x && a.y === b.y) {
        creep.memory.role = 0;
        creep.memory.role = Number(R.a.balance(cx.roleBalance, cx.creeps.map(c => c.memory.role)));
        creep.memory.becomeFreeRole = false;
        creep.memory.taste = Math.floor(Math.random() * (1 << 30));
      }

      if(updateFrozen) {
        creep.memory.oldPos = creep.pos;
      }
    }
  },
};
