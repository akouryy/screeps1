const c = require('consts');
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
      [c.roles.BUILD]: 1,
      [c.roles.CHARGE]: 3,
      [c.roles.UP]: 1,
    };

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
      sources,
      towers,
    };
  },

  log(cx) {
    console.log('  # creeps: ', JSON.stringify(
      cx.creeps.map(c => [c.name, c.memory.role, c.memory.realRole])
    ));

    if(Game.time % 20 === 0) {
      /*console.log('  # damagedStructures: ', JSON.stringify(
        cx.damagedStructures[0].map(ds => [ds.structureType, ds.pos]),
      ));*/
    }
  },
};
