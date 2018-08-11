import * as c from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import { Context } from 'context_calc';

export function tick(cx: Context, tower: StructureTower) {
  const cxr = cx.r[tower.room.name];
  if(cxr === undefined) return;

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
    if(cx.flags.debug && err !== OK && err !== ERR_NOT_ENOUGH_ENERGY) {
      console.log(ds.structureType, ds.id, err);
    }
  }
}
