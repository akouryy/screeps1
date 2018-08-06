"use strict";
// uploaded by grunt-screeps
const c = require('consts');
const R = require('rab');
const normalChara = require('chara.normal');
const contextCalc = require('context_calc');
const spawn = require('spawn');
const wroom = require('wrap.room');
const roleTower = require('role.tower');

module.exports.loop = function loop() {
  const cx = contextCalc.calc();
  // R.u.safely(() => wroom.safemode(Game.spawns.pyon.room));
  R.u.safely(() => spawn.tick(cx));

  for(const ts of cx.towers) {
    for(const tower of ts) {
      R.u.safely(() => {
        roleTower.tick(cx, tower);
      });
    }
  }

  R.u.safely(() => {
    if(Game.creeps.claimer_) {
      const creep = Game.creeps.claimer_;
      if(creep.room.name === 'W51S52') {
        creep.moveTo(creep.pos.findClosestByRange(FIND_EXIT_LEFT));
      } else {
        const err = creep.claimController(creep.room.controller);
        console.log(err);
        if(err === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    }
  });

  // creepsManager.tick(cx);
  for(const creep of cx.creeps) {
    R.u.safely(() => {
      normalChara.tick(cx, creep);
    });
  }

  if(cx.debug) R.u.safely(() => contextCalc.log(contextCalc.calc()));
}
