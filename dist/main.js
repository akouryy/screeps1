// uploaded by grunt-screeps
const c = require('consts');
const R = require('rab');
const normalChara = require('chara.normal');
const contextCalc = require('context_calc');
const spawn = require('spawn');
const balancer = require('balancer');
const wroom = require('wrap.room');
const roleBuild = require('role.build');
const roleCharge = require('role.charge');
const roleUp = require('role.up');
const roleTower = require('role.tower');


module.exports.loop = function loop() {
  const cx = contextCalc.calc();
  // R.u.safely(() => wroom.safemode(Game.spawns.pyon.room));
  R.u.safely(() => spawn.tick(cx));
  R.u.safely(() => balancer.tick(cx));

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
    if(true)
    R.u.safely(() => {
      normalChara.tick(cx, creep);
    });
    else
    R.u.safely(() => {
      if(creep.memory.role === c.roles.CHARGE) {
        if(cx.rooms[0].energyAvailable < cx.rooms[0].energyCapacityAvailable) {
          roleCharge.tick(cx, creep, 1);
        } else {
          roleUp.tick(cx, creep);
        }
      } else if(creep.memory.role == c.roles.UP) {
        if(cx.rooms[0].energyAvailable < cx.rooms[0].energyCapacityAvailable / 2
          /*||Game.rooms.W51S52.controller.ticksToDowngrade > 5000*/
          /*&& creep.memory.taste / 2 % 35 < 25*/
          /*&& cx.creeps.length < 13 && !creep.memory.alwaysUp*/) {
          roleCharge.tick(cx, creep, 0);
        } else {
          roleUp.tick(cx, creep);
        }
      } else if(creep.memory.role == c.roles.BUILD) {
        if(cx.constructionSites[0].length > 0) {
          roleBuild.tick(cx, creep);
        } else {
          roleUp.tick(cx, creep);
        }
      }
    });
  }

  if(cx.debug) R.u.safely(() => contextCalc.log(contextCalc.calc()));
}
