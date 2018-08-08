"use strict";
const c = require('consts');
const R = require('rab');

const exp = module.exports = {
  tick: (cx, tower) => {
    const cxr = cx.r[tower.room.name];

    const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
      tower.attack(closestHostile);
      return; // TODO: エネルギーチェック
    }

    const dsss = (
      cxr.attacked ?
        [cx.damagedWalls, cx.damagedWalls, cx.damagedRamparts, cx.damagedRamparts, cx.damagedRoads, cx.damagedContainers] :
        [cx.damagedWalls, cx.damagedRamparts, cx.damagedRoads, cx.damagedContainers]
    ).filter(dss => dss.length > 0);
    const dss = R.a.sample(dsss);
    const ds = dss[0][0 | Math.random() * Math.min(3, dss.length)];
    if(ds) {
      const err = tower.repair(ds);
      if(cx.debug && err !== OK && err !== ERR_NOT_ENOUGH_ENERGY) {
        console.log(ds.structureType, ds.id, err);
      }
    }
  },
};
