"use strict";
const C = require('consts');
const M = require('wrap.memory');
const R = require('rab');

const exp = module.exports = {
  calc() {
    const flg = n => Game.flags[n] && Game.flags[n].color !== COLOR_WHITE;

    const debug = flg('_DEBUG');
    const stopSpawn = flg('_STOPSPAWN');
    const shouldPickup = flg('_PICKUP');

    const spawningCreepNames = Game.spawns.pyon.spawning ? [Game.spawns.pyon.spawning.name] : [];
    const creeps = _.values(Game.creeps).filter(c =>
      !c.memory.isSpecial &&
      !spawningCreepNames.includes(c.name)
    );
    const rooms = _.values(Game.rooms);
    const constructionSites = rooms.map(r => r.find(FIND_CONSTRUCTION_SITES));

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
    const containers = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_CONTAINER && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );

    const roomSpecific = {};

    for(const room of rooms) {
      const workBalance = {
        [C.NormalCharaStates.WORK_SPAWN]: creeps.length > 11 ? 2 : creeps.length > 9 ? 5 : 7,
        [C.NormalCharaStates.WORK_UP]: 4,
        [C.NormalCharaStates.WORK_TOWER]: 2,
        [C.NormalCharaStates.WORK_BUILD]: constructionSites[0].length > 10 ? 2 : constructionSites[0].length > 0 ? 2 : 1,
      };

      const sources = room.find(FIND_SOURCES);

      const sourcesBalance = {
        [sources[0].id]: sources[0].energy > 0 ? 8 : 0.01,
        [sources[1].id]: sources[1].energy > 0 ? 4 : 0.01,
      };

      const cSites = room.find(FIND_CONSTRUCTION_SITES);

      const spawnsUnfilled = room.find(FIND_STRUCTURES, {
        filter: structure =>
          [STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(structure.structureType) &&
            structure.energy < structure.energyCapacity,
      });


      roomSpecific[room.name] = {
        constructionSites: cSites,
        sources,
        sourcesBalance,
        spawnsUnfilled,
        workBalance,
      };
    }

    return {
      constructionSites,
      containers,
      creeps,
      damagedRamparts,
      damagedRoads,
      damagedWalls,
      debug,
      rooms,
      r: roomSpecific,
      shouldPickup,
      sources,
      stopSpawn,
      towers,
    };
  },

  log(cx) {
    console.log(
      [
        `[${Game.time}=0b${Game.time.toString(2)}]`,

        `*       creeps[${cx.creeps.length}]: ` +
          cx.creeps.map(c => {
            const mem = M(c);
            return `${
              c.name
            }${
              C.NormalCharaStateToShortName[mem.ncState]
            },${
              mem.ncState === C.NormalCharaStates.GAIN_SRC ?
                mem.ncSrcID && mem.ncSrcID.substr(-3) :
              mem.ncState === C.NormalCharaStates.WORK_BUILD ?
                mem.ncWbTgtID && mem.ncWbTgtID.substr(-3):
              mem.ncState === C.NormalCharaStates.WORK_SPAWN ?
                mem.ncWsSpnID && mem.ncWsSpnID.substr(-3):
                null
            }`;
          }).join('; ') +
          ' '.repeat(100),

        (Game.time & 15) === 1 &&
          '*       creeps[].part: ' +
          cx.creeps.map(c =>
            `${
              c.name
            }:${
              c.body.map(p => p.type[0]).join('')
            }`
          ).join(', '),

        (Game.time & 15) === 3 &&
          '*       flags: ' +
          ['debug', 'stopSpawn', 'shouldPickup'].map(f => `${f}=${cx[f]}`).join(', ')
      ].filter(x => x).join('\n')
    );
  },
};
