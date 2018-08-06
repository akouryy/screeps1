"use strict";
const c = require('consts');
const R = require('rab');

const exp = module.exports = {
  tick: (cx, tower) => {
    const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
      tower.attack(closestHostile);
      return; // TODO: エネルギーチェック
    }

    const dsss = [cx.damagedRamparts, cx.damagedRoads, cx.damagedWalls].filter(dss => dss.length > 0);
    const dss = dsss[Game.time % 3];
    const ds = dss[0][Math.floor(Math.random() * Math.min(3, dss.length))];
    if(ds) {
      const err = tower.repair(ds);
      if(cx.debug && err !== OK && err !== ERR_NOT_ENOUGH_ENERGY) {
        console.log(ds.structureType, ds.id, err);
      }
    }
  },
};
