const C = require('consts');
const R = require('rab');

const exp = module.exports = {
  calc() {
    const debug = Game.flags._DEBUG.color === COLOR_YELLOW;

    const creeps = _.values(Game.creeps).filter(c => !c.memory.isSpecial);
    const rooms = _.values(Game.rooms);
    const constructionSites = rooms.map(r => r.find(FIND_CONSTRUCTION_SITES));
    const chargeables = rooms.map(r => r.find(FIND_STRUCTURES, {
      filter: structure =>
        [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER].includes(structure.structureType) &&
          structure.energy < structure.energyCapacity,
    }));
    const sources = rooms.map(r => r.find(FIND_SOURCES));
    const towers = rooms.map(r => r.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}));
    const damagedWalls = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_WALL && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );
    const damagedRamparts = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_RAMPART && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );
    const damagedRoads = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_ROAD && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );

    const roleBalance = {
      [C.roles.BUILD]: 1,
      [C.roles.CHARGE]: 3,
      [C.roles.UP]: 1,
    };

    const roomSpecific = {};

    for(const room of rooms) {
      const workBalance = {
        [C.NormalCharaStates.WORK_SPAWN]: 3,
        [C.NormalCharaStates.WORK_UP]: 1,
        [C.NormalCharaStates.WORK_TOWER]: 1,
        [C.NormalCharaStates.WORK_BUILD]: 1,
      };

      const sources = room.find(FIND_SOURCES);

      const sourcesBalance = {
        [sources[0]]: 3,
        [sources[1]]: 1,
      };

      roomSpecific[room.name] = {
        sources,
        sourcesBalance,
        workBalance,
      };
    }

    return {
      chargeables,
      constructionSites,
      creeps,
      damagedRamparts,
      damagedRoads,
      damagedWalls,
      debug,
      roleBalance,
      rooms,
      r: roomSpecific,
      sources,
      towers,
    };
  },

  log(cx) {
    console.log('  # creeps: ', JSON.stringify(
      cx.creeps.map(c => [
        c.name,
        c.memory.normalCharaState,
        c.memory.normalCharaState === C.NormalCharaStates.GAIN_SRC ?
          c.memory.normalCharaSourceID.substring(10,14) :
          null,
      ])
    ));

    if(Game.time % 20 === 0) {
      /*console.log('  # damagedStructures: ', JSON.stringify(
        cx.damagedStructures[0].map(ds => [ds.structureType, ds.pos]),
      ));*/
    }
  },
};
